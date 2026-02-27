import type { FastifyInstance } from 'fastify';
import { eq, sql, gte, lte, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  members,
  semesters,
  semesterMembers,
  records,
  verifications,
  photos,
} from '../db/schema.js';
import { requireAdmin } from '../plugins/auth.js';

export default async function adminRoutes(app: FastifyInstance) {
  // GET /api/admin/dashboard — dashboard statistics (admin only)
  app.get('/api/admin/dashboard', { preHandler: requireAdmin }, async () => {
    // Current semester
    const [semester] = await db
      .select()
      .from(semesters)
      .where(eq(semesters.isCurrent, true))
      .limit(1);

    // Member count for current semester
    let memberCount = 0;
    if (semester) {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(semesterMembers)
        .where(eq(semesterMembers.semesterId, semester.id));
      memberCount = result.count;
    }

    // This month's record count
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthStart = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const monthEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

    const [recordsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(records)
      .where(
        sql`${records.date} >= ${monthStart} AND ${records.date} <= ${monthEnd}`,
      );
    const monthlyRecordCount = recordsResult.count;

    // Gallery photo count
    const [photosResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(photos);
    const photoCount = photosResult.count;

    // Recent 10 records with member names
    const recentRecords = await db
      .select({
        id: records.id,
        memberId: records.memberId,
        date: records.date,
        course: records.course,
        createdAt: records.createdAt,
        memberName: members.name,
      })
      .from(records)
      .innerJoin(members, eq(records.memberId, members.id))
      .orderBy(desc(records.id))
      .limit(10);

    return {
      semester: semester?.name ?? null,
      memberCount,
      monthlyRecordCount,
      photoCount,
      recentRecords,
    };
  });

  // POST /api/admin/lottery — mileage-weighted random member selection
  app.post('/api/admin/lottery', { preHandler: requireAdmin }, async () => {
    // Current semester
    const [semester] = await db
      .select()
      .from(semesters)
      .where(eq(semesters.isCurrent, true))
      .limit(1);

    if (!semester) {
      return { winner: null, members: [] };
    }

    // Get current semester members with their mileage (verification scores)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthStart = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const monthEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

    const memberStats = await db
      .select({
        memberId: members.id,
        name: members.name,
        studentId: members.studentId,
        score: sql<number>`coalesce(sum(${verifications.score}), 0)`,
        count: sql<number>`count(${verifications.id})`,
      })
      .from(semesterMembers)
      .innerJoin(members, eq(semesterMembers.memberId, members.id))
      .leftJoin(
        verifications,
        sql`${verifications.memberId} = ${members.id} AND ${verifications.date} >= ${monthStart} AND ${verifications.date} <= ${monthEnd}`,
      )
      .where(eq(semesterMembers.semesterId, semester.id))
      .groupBy(members.id);

    // Filter to only members with mileage > 0
    const eligible = memberStats.filter((m) => m.score > 0);

    if (eligible.length === 0) {
      return { winner: null, members: memberStats };
    }

    // Weighted random selection based on mileage score
    const totalScore = eligible.reduce((sum, m) => sum + m.score, 0);
    let random = Math.random() * totalScore;

    let winner = eligible[0];
    for (const member of eligible) {
      random -= member.score;
      if (random <= 0) {
        winner = member;
        break;
      }
    }

    return { winner, members: memberStats };
  });
}
