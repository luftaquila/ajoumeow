import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, like } from 'drizzle-orm';
import { db } from '../db/index.js';
import { members, semesters, semesterMembers, registrations } from '../db/schema.js';
import { requireAdmin } from '../plugins/auth.js';

const createMemberSchema = z.object({
  student_id: z.string().min(1),
  name: z.string().min(1),
  college: z.string().min(1),
  department: z.string().min(1),
  phone: z.string().min(1),
  birthday: z.string().optional(),
  volunteer_id: z.string().optional(),
  role: z.string().optional(),
});

const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  college: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  birthday: z.string().nullable().optional(),
  volunteer_id: z.string().nullable().optional(),
  role: z.string().optional(),
});

const nameQuerySchema = z.object({
  q: z.string().min(1),
});

const registerSchema = z.object({
  student_id: z.string().min(1),
  name: z.string().min(1),
  college: z.string().min(1),
  department: z.string().min(1),
  phone: z.string().min(1),
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

  // POST /api/users — register new or returning member
  app.post('/api/users', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = createMemberSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', statusCode: 400 });
    }

    const { student_id, name, college, department, phone, birthday, volunteer_id, role } =
      parsed.data;

    const semester = await getCurrentSemester();
    if (!semester) {
      return reply
        .status(500)
        .send({ error: 'No current semester configured', statusCode: 500 });
    }

    // Check if member already exists
    const [existing] = await db
      .select()
      .from(members)
      .where(eq(members.studentId, student_id))
      .limit(1);

    if (existing) {
      // Check if already registered in current semester
      const [alreadyRegistered] = await db
        .select()
        .from(semesterMembers)
        .where(
          and(
            eq(semesterMembers.memberId, existing.id),
            eq(semesterMembers.semesterId, semester.id),
          ),
        )
        .limit(1);

      if (alreadyRegistered) {
        return reply
          .status(409)
          .send({ error: 'Member already registered in current semester', statusCode: 409 });
      }

      // Returning member — add to current semester
      await db.insert(semesterMembers).values({
        semesterId: semester.id,
        memberId: existing.id,
        role: role ?? '회원',
      });

      return { id: existing.id, studentId: existing.studentId, name: existing.name, role: role ?? '회원' };
    }

    // New member — insert into members + semester_members
    const [newMember] = await db
      .insert(members)
      .values({
        studentId: student_id,
        name,
        college,
        department,
        phone,
        birthday: birthday ?? null,
        volunteerId: volunteer_id ?? null,
      })
      .returning();

    await db.insert(semesterMembers).values({
      semesterId: semester.id,
      memberId: newMember.id,
      role: role ?? '회원',
    });

    return { id: newMember.id, studentId: newMember.studentId, name: newMember.name, role: role ?? '회원' };
  });

  // PUT /api/users/:studentId — update member info
  app.put('/api/users/:studentId', { preHandler: requireAdmin }, async (request, reply) => {
    const { studentId } = request.params as { studentId: string };

    const parsed = updateMemberSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', statusCode: 400 });
    }

    const data = parsed.data;

    // Find the member
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.studentId, studentId))
      .limit(1);

    if (!member) {
      return reply.status(404).send({ error: 'Member not found', statusCode: 404 });
    }

    // Build members table update (exclude role — it's on semester_members)
    const memberUpdate: Record<string, string | null> = {};
    if (data.name !== undefined) memberUpdate.name = data.name;
    if (data.college !== undefined) memberUpdate.college = data.college;
    if (data.department !== undefined) memberUpdate.department = data.department;
    if (data.phone !== undefined) memberUpdate.phone = data.phone;
    if (data.birthday !== undefined) memberUpdate.birthday = data.birthday ?? null;
    if (data.volunteer_id !== undefined) memberUpdate.volunteerId = data.volunteer_id ?? null;

    if (Object.keys(memberUpdate).length > 0) {
      await db.update(members).set(memberUpdate).where(eq(members.id, member.id));
    }

    // Update role on semester_members if provided
    if (data.role !== undefined) {
      const semester = await getCurrentSemester();
      if (semester) {
        await db
          .update(semesterMembers)
          .set({ role: data.role })
          .where(
            and(
              eq(semesterMembers.memberId, member.id),
              eq(semesterMembers.semesterId, semester.id),
            ),
          );
      }
    }

    return { success: true };
  });

  // DELETE /api/users/:studentId — remove from current semester
  app.delete('/api/users/:studentId', { preHandler: requireAdmin }, async (request, reply) => {
    const { studentId } = request.params as { studentId: string };

    const semester = await getCurrentSemester();
    if (!semester) {
      return reply
        .status(500)
        .send({ error: 'No current semester configured', statusCode: 500 });
    }

    // Find the member
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.studentId, studentId))
      .limit(1);

    if (!member) {
      return reply.status(404).send({ error: 'Member not found', statusCode: 404 });
    }

    // Delete from semester_members only (keep members record)
    const result = await db
      .delete(semesterMembers)
      .where(
        and(
          eq(semesterMembers.memberId, member.id),
          eq(semesterMembers.semesterId, semester.id),
        ),
      )
      .returning();

    if (result.length === 0) {
      return reply
        .status(404)
        .send({ error: 'Member not registered in current semester', statusCode: 404 });
    }

    return { success: true };
  });

  // GET /api/users/register — list current semester registrations (admin only)
  app.get('/api/users/register', { preHandler: requireAdmin }, async (_request, reply) => {
    const semester = await getCurrentSemester();
    if (!semester) {
      return reply
        .status(500)
        .send({ error: 'No current semester configured', statusCode: 500 });
    }

    const registrationList = await db
      .select()
      .from(registrations)
      .where(eq(registrations.semesterId, semester.id));

    return registrationList;
  });

  // POST /api/users/register — submit registration application (public, no auth)
  app.post('/api/users/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', statusCode: 400 });
    }

    const { student_id, name, college, department, phone } = parsed.data;

    const semester = await getCurrentSemester();
    if (!semester) {
      return reply
        .status(500)
        .send({ error: 'No current semester configured', statusCode: 500 });
    }

    // Check if already registered as a member in current semester
    const [existingMember] = await db
      .select({ id: members.id })
      .from(members)
      .innerJoin(semesterMembers, eq(members.id, semesterMembers.memberId))
      .where(
        and(
          eq(members.studentId, student_id),
          eq(semesterMembers.semesterId, semester.id),
        ),
      )
      .limit(1);

    if (existingMember) {
      return reply
        .status(409)
        .send({ error: 'Already registered as a member in current semester', statusCode: 409 });
    }

    // Check if already submitted a registration application for current semester
    const [existingRegistration] = await db
      .select({ id: registrations.id })
      .from(registrations)
      .where(
        and(
          eq(registrations.studentId, student_id),
          eq(registrations.semesterId, semester.id),
        ),
      )
      .limit(1);

    if (existingRegistration) {
      return reply
        .status(409)
        .send({ error: 'Registration application already submitted', statusCode: 409 });
    }

    const [registration] = await db
      .insert(registrations)
      .values({
        studentId: student_id,
        name,
        college,
        department,
        phone,
        semesterId: semester.id,
      })
      .returning();

    return registration;
  });
}
