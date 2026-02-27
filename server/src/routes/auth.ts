import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { members, semesters, semesterMembers } from '../db/schema.js';
import { signToken, authenticate } from '../plugins/auth.js';

const loginSchema = z.object({
  student_id: z.string().min(1),
});

async function getCurrentSemester() {
  const [semester] = await db
    .select()
    .from(semesters)
    .where(eq(semesters.isCurrent, true))
    .limit(1);
  return semester ?? null;
}

async function findMemberInSemester(studentId: string, semesterId: number) {
  const [result] = await db
    .select({
      memberId: members.id,
      studentId: members.studentId,
      name: members.name,
      role: semesterMembers.role,
    })
    .from(members)
    .innerJoin(semesterMembers, eq(members.id, semesterMembers.memberId))
    .where(
      and(eq(members.studentId, studentId), eq(semesterMembers.semesterId, semesterId)),
    )
    .limit(1);
  return result ?? null;
}

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/api/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', statusCode: 400 });
    }

    const { student_id } = parsed.data;

    const semester = await getCurrentSemester();
    if (!semester) {
      return reply
        .status(500)
        .send({ error: 'No current semester configured', statusCode: 500 });
    }

    const member = await findMemberInSemester(student_id, semester.id);
    if (!member) {
      return reply
        .status(401)
        .send({ error: 'Member not found in current semester', statusCode: 401 });
    }

    const token = signToken({
      memberId: member.memberId,
      studentId: member.studentId,
      role: member.role,
      semester: semester.name,
    });

    return {
      token,
      user: {
        id: member.memberId,
        studentId: member.studentId,
        name: member.name,
        role: member.role,
        semester: semester.name,
      },
    };
  });

  // POST /api/auth/autologin
  app.post(
    '/api/auth/autologin',
    { preHandler: authenticate },
    async (request, reply) => {
      const { studentId } = request.user;

      const semester = await getCurrentSemester();
      if (!semester) {
        return reply
          .status(500)
          .send({ error: 'No current semester configured', statusCode: 500 });
      }

      const member = await findMemberInSemester(studentId, semester.id);
      if (!member) {
        return reply
          .status(401)
          .send({
            error: 'Member no longer registered in current semester',
            statusCode: 401,
          });
      }

      // Re-issue token with updated info (role/semester may have changed)
      const token = signToken({
        memberId: member.memberId,
        studentId: member.studentId,
        role: member.role,
        semester: semester.name,
      });

      return {
        token,
        user: {
          id: member.memberId,
          studentId: member.studentId,
          name: member.name,
          role: member.role,
          semester: semester.name,
        },
      };
    },
  );
}
