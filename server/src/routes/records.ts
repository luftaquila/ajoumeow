import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { records, members } from '../db/schema.js';
import { authenticate } from '../plugins/auth.js';

const recordsQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const createRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  course: z.string().min(1),
});

function maskName(name: string): string {
  if (name.length === 0) return name;
  return name[0] + '*'.repeat(name.length - 1);
}

export default async function recordsRoutes(app: FastifyInstance) {
  // GET /api/records?from=YYYY-MM-DD&to=YYYY-MM-DD
  // Non-admin users see masked names (first character only)
  app.get('/api/records', async (request, reply) => {
    const parsed = recordsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters. Required: from=YYYY-MM-DD&to=YYYY-MM-DD',
        statusCode: 400,
      });
    }

    const { from, to } = parsed.data;

    // Check if user is authenticated (optional — don't reject if no token)
    let isAdmin = false;
    const token = request.headers['x-access-token'] as string | undefined;
    if (token) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(
          token,
          process.env.JWT_SECRET || '',
        ) as { role: string };
        isAdmin = decoded.role !== '회원';
      } catch {
        // Invalid token — treat as unauthenticated
      }
    }

    const recordList = await db
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
      .where(and(gte(records.date, from), lte(records.date, to)));

    if (!isAdmin) {
      return recordList.map((r) => ({
        ...r,
        memberName: maskName(r.memberName),
        studentId: undefined,
      }));
    }

    return recordList;
  });

  // POST /api/records — create a feeding record
  app.post('/api/records', { preHandler: authenticate }, async (request, reply) => {
    const parsed = createRecordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', statusCode: 400 });
    }

    const { date, course } = parsed.data;
    const { memberId } = request.user;

    const [record] = await db
      .insert(records)
      .values({
        memberId,
        date,
        course,
      })
      .returning();

    return record;
  });

  // DELETE /api/records/:id — cancel own record
  app.delete('/api/records/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const recordId = parseInt(id, 10);

    if (isNaN(recordId)) {
      return reply.status(400).send({ error: 'Invalid record ID', statusCode: 400 });
    }

    // Find the record
    const [record] = await db.select().from(records).where(eq(records.id, recordId)).limit(1);

    if (!record) {
      return reply.status(404).send({ error: 'Record not found', statusCode: 404 });
    }

    // Only the owner can delete their own record
    if (record.memberId !== request.user.memberId) {
      return reply.status(403).send({ error: 'Can only cancel your own records', statusCode: 403 });
    }

    await db.delete(records).where(eq(records.id, recordId));

    return { success: true };
  });
}
