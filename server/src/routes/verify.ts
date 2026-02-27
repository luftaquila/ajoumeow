import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, sql, between } from 'drizzle-orm';
import { db } from '../db/index.js';
import { verifications, records, members, semesterMembers, semesters } from '../db/schema.js';
import { authenticate, requireAdmin } from '../plugins/auth.js';

const certificateQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const createVerificationSchema = z.object({
  memberId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  course: z.string().min(1),
  score: z.number(),
});

export default async function verifyRoutes(app: FastifyInstance) {
  // GET /api/verify — verifications + unverified records for a given date (default: today)
  app.get('/api/verify', { preHandler: authenticate }, async (request) => {
    const query = request.query as { date?: string };
    const dateSchema = z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });
    const parsed = dateSchema.safeParse(query);
    const targetDate = parsed.success && parsed.data.date
      ? parsed.data.date
      : new Date().toISOString().slice(0, 10);

    // Verifications for the target date
    const dateVerifications = await db
      .select({
        id: verifications.id,
        memberId: verifications.memberId,
        date: verifications.date,
        course: verifications.course,
        score: verifications.score,
        verifiedAt: verifications.verifiedAt,
        memberName: members.name,
        studentId: members.studentId,
      })
      .from(verifications)
      .innerJoin(members, eq(verifications.memberId, members.id))
      .where(eq(verifications.date, targetDate));

    // Records for the target date that have no matching verification
    const unverifiedRecords = await db
      .select({
        id: records.id,
        memberId: records.memberId,
        date: records.date,
        course: records.course,
        createdAt: records.createdAt,
        memberName: members.name,
        studentId: members.studentId,
      })
      .from(records)
      .innerJoin(members, eq(records.memberId, members.id))
      .where(
        and(
          eq(records.date, targetDate),
          sql`NOT EXISTS (
            SELECT 1 FROM verifications v
            WHERE v.member_id = ${records.memberId}
              AND v.date = ${records.date}
              AND v.course = ${records.course}
          )`,
        ),
      );

    return { verifications: dateVerifications, unverified: unverifiedRecords };
  });

  // GET /api/verify/latest — most recent verification date
  app.get('/api/verify/latest', { preHandler: authenticate }, async () => {
    const [latest] = await db
      .select({ date: verifications.date })
      .from(verifications)
      .orderBy(sql`${verifications.date} DESC`)
      .limit(1);

    return { date: latest?.date ?? null };
  });

  // POST /api/verify — create a verification record
  app.post('/api/verify', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = createVerificationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', statusCode: 400 });
    }

    const { memberId, date, course, score } = parsed.data;

    const [verification] = await db
      .insert(verifications)
      .values({ memberId, date, course, score })
      .returning();

    return verification;
  });

  // DELETE /api/verify/:id — delete a verification record
  app.delete('/api/verify/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const verificationId = parseInt(id, 10);

    if (isNaN(verificationId)) {
      return reply.status(400).send({ error: 'Invalid verification ID', statusCode: 400 });
    }

    const deleted = await db
      .delete(verifications)
      .where(eq(verifications.id, verificationId))
      .returning();

    if (deleted.length === 0) {
      return reply.status(404).send({ error: 'Verification not found', statusCode: 404 });
    }

    return { success: true };
  });

  // GET /api/verify/1365 — generate 1365 volunteer certificate via Google Apps Script
  app.get('/api/verify/1365', { preHandler: requireAdmin }, async (request, reply) => {
    const query = request.query as { start?: string; end?: string; mask?: string };

    const parsed = certificateQuerySchema.safeParse(query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query parameters. Required: start (YYYY-MM-DD), end (YYYY-MM-DD)', statusCode: 400 });
    }

    const { start, end } = parsed.data;
    const mask = query.mask === 'true';

    const macroUrl = process.env.MACRO_1365_URL;
    if (!macroUrl) {
      return reply.status(500).send({ error: 'MACRO_1365_URL environment variable is not configured', statusCode: 500 });
    }

    // Get current semester
    const [currentSemester] = await db
      .select()
      .from(semesters)
      .where(eq(semesters.isCurrent, true));

    if (!currentSemester) {
      return reply.status(500).send({ error: 'No current semester configured', statusCode: 500 });
    }

    // Get current semester members with their details
    const memberList = await db
      .select({
        memberId: members.id,
        studentId: members.studentId,
        name: members.name,
        phone: members.phone,
        birthday: members.birthday,
        volunteerId: members.volunteerId,
        role: semesterMembers.role,
      })
      .from(semesterMembers)
      .innerJoin(members, eq(semesterMembers.memberId, members.id))
      .where(eq(semesterMembers.semesterId, currentSemester.id));

    // Get verifications in date range
    const verificationList = await db
      .select({
        memberId: verifications.memberId,
        date: verifications.date,
        course: verifications.course,
        verifiedAt: verifications.verifiedAt,
      })
      .from(verifications)
      .where(between(verifications.date, start, end))
      .orderBy(verifications.date);

    // Find the chief (회장)
    const chief = memberList.find((m) => m.role === '회장');

    // Aggregate activities per member per date
    const payload: Array<{
      ID: string;
      volID: string;
      name: string;
      birthday: string;
      phone: string;
      date: string;
      hour: number;
      timestamp: number;
    }> = [];

    for (const activity of verificationList) {
      const member = memberList.find((m) => m.memberId === activity.memberId);
      if (!member || !member.volunteerId) continue;

      // Format date as yyyy.mm.dd
      const formattedDate = activity.date.replace(/-/g, '.');

      // Check if same member + same date already exists in payload
      const prev = payload.find(
        (data) => data.ID === member.studentId && data.date === formattedDate,
      );

      if (prev) {
        prev.hour++;
      } else {
        // Determine timestamp: if verified on the same day, use the time; otherwise default to 1900
        let timestamp = 1900;
        if (activity.verifiedAt) {
          const verifiedDate = activity.verifiedAt.slice(0, 10);
          if (verifiedDate === activity.date) {
            const timePart = activity.verifiedAt.slice(11, 16).replace(':', '');
            timestamp = parseInt(timePart, 10) || 1900;
          }
        }

        payload.push({
          ID: member.studentId,
          volID: member.volunteerId,
          name: member.name,
          birthday: member.birthday || '',
          phone: member.phone,
          date: formattedDate,
          hour: 1,
          timestamp,
        });
      }
    }

    // POST to Google Apps Script macro
    const response = await fetch(macroUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: payload,
        cheif: {
          name: chief ? chief.name : '',
          phone: chief ? chief.phone : '',
        },
        mask,
      }),
    });

    const result = await response.json();
    return result;
  });
}
