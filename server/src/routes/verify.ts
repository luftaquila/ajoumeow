import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { verifications, records, members } from '../db/schema.js';
import { authenticate, requireAdmin } from '../plugins/auth.js';

const createVerificationSchema = z.object({
  memberId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  course: z.string().min(1),
  score: z.number(),
});

export default async function verifyRoutes(app: FastifyInstance) {
  // GET /api/verify — today's verifications + unverified records
  app.get('/api/verify', { preHandler: authenticate }, async () => {
    const today = new Date().toISOString().slice(0, 10);

    // Today's verifications
    const todayVerifications = await db
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
      .where(eq(verifications.date, today));

    // Today's records that have no matching verification
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
          eq(records.date, today),
          sql`NOT EXISTS (
            SELECT 1 FROM verifications v
            WHERE v.member_id = ${records.memberId}
              AND v.date = ${records.date}
              AND v.course = ${records.course}
          )`,
        ),
      );

    return { verifications: todayVerifications, unverified: unverifiedRecords };
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
}
