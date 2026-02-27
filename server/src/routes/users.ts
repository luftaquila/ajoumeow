import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, like } from 'drizzle-orm';
import { db } from '../db/index.js';
import { members, semesters, semesterMembers } from '../db/schema.js';
import { requireAdmin } from '../plugins/auth.js';

const nameQuerySchema = z.object({
  q: z.string().min(1),
});

async function getCurrentSemester() {
  const [semester] = await db
    .select()
    .from(semesters)
    .where(eq(semesters.isCurrent, true))
    .limit(1);
  return semester ?? null;
}

export default async function usersRoutes(app: FastifyInstance) {
  // GET /api/users/list — current semester members, or all semester names if ?all=true
  app.get('/api/users/list', { preHandler: requireAdmin }, async (request, reply) => {
    const { all } = request.query as { all?: string };

    if (all === 'true') {
      const allSemesters = await db.select({ name: semesters.name }).from(semesters);
      return allSemesters.map((s) => s.name);
    }

    const semester = await getCurrentSemester();
    if (!semester) {
      return reply
        .status(500)
        .send({ error: 'No current semester configured', statusCode: 500 });
    }

    const memberList = await db
      .select({
        id: members.id,
        studentId: members.studentId,
        name: members.name,
        college: members.college,
        department: members.department,
        phone: members.phone,
        birthday: members.birthday,
        volunteerId: members.volunteerId,
        role: semesterMembers.role,
        registeredAt: semesterMembers.registeredAt,
      })
      .from(semesterMembers)
      .innerJoin(members, eq(semesterMembers.memberId, members.id))
      .where(eq(semesterMembers.semesterId, semester.id));

    return memberList;
  });

  // GET /api/users/name?q=검색어 — search members by name
  app.get('/api/users/name', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = nameQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Missing or invalid query parameter "q"', statusCode: 400 });
    }

    const { q } = parsed.data;

    const results = await db
      .select({
        id: members.id,
        studentId: members.studentId,
        name: members.name,
        college: members.college,
        department: members.department,
        phone: members.phone,
      })
      .from(members)
      .where(like(members.name, `%${q}%`));

    return results;
  });
}
