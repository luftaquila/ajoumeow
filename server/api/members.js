import { eq, and, like } from 'drizzle-orm';

import { db, sqlite } from '../db/index.js';
import { members, semesters, semesterMembers } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Log, success, error } from '../controllers/util/interface.js';

export default async function(fastify, opts) {

  // Get member list by semester
  fastify.get('/', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const semester = db.select().from(semesters).where(eq(semesters.name, request.query.semester)).get();
      if (!semester) {
        return reply.code(400).send(error('ERR_SEMESTER_NOT_FOUND', '해당 학기를 찾을 수 없습니다.'));
      }
      const result = sqlite.prepare(`
        SELECT
          m.college,
          m.department,
          m.student_id AS studentId,
          m.name,
          m.phone,
          m.birthday,
          m.volunteer_id AS volunteerId,
          m.google_id AS googleId,
          m.google_email AS googleEmail,
          sm.role,
          (SELECT s2.name FROM semester_members sm2
           JOIN semesters s2 ON sm2.semester_id = s2.id
           WHERE sm2.member_id = m.id
           ORDER BY sm2.id ASC LIMIT 1) AS enrolledSemester
        FROM semester_members sm
        JOIN members m ON sm.member_id = m.id
        WHERE sm.semester_id = ?
      `).all(semester.id);

      util.logger(new Log('info', request.remoteIP, request.originalPath, '명단 요청', request.method, 200, request.query, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '명단 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // Search members by name
  fastify.get('/search', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const semester = util.getCurrentSemester();
      if (!semester) {
        return reply.code(400).send(error('ERR_NO_SEMESTER', '현재 학기 설정이 없습니다.'));
      }
      const result = db.select({
        name: members.name,
        studentId: members.studentId,
      })
        .from(members)
        .innerJoin(semesterMembers, eq(semesterMembers.memberId, members.id))
        .where(and(eq(semesterMembers.semesterId, semester.id), like(members.name, `%${request.query.query}%`)))
        .all();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '사용자 정보 요청', request.method, 200, request.query, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '사용자 정보 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // Lookup existing member by studentId
  fastify.get('/lookup/:studentId', async (request, reply) => {
    try {
      const studentId = String(request.params.studentId);
      const currentSemester = util.getCurrentSemester();

      const previousMember = db.select().from(members).where(eq(members.studentId, studentId)).get();
      util.logger(new Log('info', request.remoteIP, request.originalPath, '기존 회원 등록여부 조회', request.method, 200, request.params, previousMember));

      if (previousMember) {
        const smInfo = sqlite.prepare(`
          SELECT sm.role, s.name AS enrolledSemester
          FROM semester_members sm
          JOIN semesters s ON sm.semester_id = s.id
          WHERE sm.member_id = ?
          ORDER BY sm.id ASC LIMIT 1
        `).get(previousMember.id);

        // Check if already registered in current semester
        let alreadyRegistered = false;
        if (currentSemester) {
          const existing = db.select().from(semesterMembers)
            .where(and(eq(semesterMembers.memberId, previousMember.id), eq(semesterMembers.semesterId, currentSemester.id)))
            .get();
          alreadyRegistered = !!existing;
        }

        return reply.code(200).send(success({
          college: previousMember.college,
          department: previousMember.department,
          studentId: previousMember.studentId,
          name: previousMember.name,
          phone: previousMember.phone,
          birthday: previousMember.birthday,
          volunteerId: previousMember.volunteerId,
          enrolledSemester: smInfo ? smInfo.enrolledSemester : null,
          role: smInfo ? smInfo.role : '회원',
          alreadyRegistered,
        }));
      }
      else {
        return reply.code(400).send(error('ERR_NEVER_REGISTERED', '기존 회원이 아닙니다.<br>신입 회원으로 등록해 주세요.'));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '회원 조회 오류', request.method, 500, request.params, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // Register new or returning member
  fastify.post('/', async (request, reply) => {
    try {
      const currentSemester = util.getCurrentSemester();
      const studentId = String(request.body.studentId);

      // Check if already registered in current semester
      if (currentSemester) {
        const existing = db.select().from(semesterMembers)
          .innerJoin(members, eq(semesterMembers.memberId, members.id))
          .where(and(eq(members.studentId, studentId), eq(semesterMembers.semesterId, currentSemester.id)))
          .get();

        if (existing) {
          util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 등록', request.method, 400, request.body, 'ERR_ALREADY_REGISTERED'));
          return reply.code(400).send(error('ERR_ALREADY_REGISTERED', '이미 이번 학기 회원으로 등록되셨습니다.'));
        }
      }

      const previousMember = db.select().from(members).where(eq(members.studentId, studentId)).get();

      if(request.body.isNew === true || request.body.isNew === 'true') {
        if (previousMember) {
          util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 등록', request.method, 400, request.body, 'ERR_REGISTERED_BEFORE'));
          return reply.code(400).send(error('ERR_REGISTERED_BEFORE', '지난 학기에 가입한 적이 있습니다.<br>기존 회원으로 등록해 주세요.'));
        }
      } else {
        if (!previousMember) {
          util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 등록', request.method, 400, request.body, 'ERR_NEVER_REGISTERED'));
          return reply.code(400).send(error('ERR_NEVER_REGISTERED', '기존 회원이 아닙니다.<br>신입 회원으로 등록해 주세요.'));
        }
      }

      // Ensure current semester exists
      let semesterId;
      if (currentSemester) {
        semesterId = currentSemester.id;
      } else {
        const semesterName = util.getSettings('currentSemester');
        const result = db.insert(semesters).values({ name: semesterName }).run();
        semesterId = result.lastInsertRowid;
      }

      // Insert or update member
      let memberId;
      if (previousMember) {
        db.update(members).set({
          college: request.body.college,
          department: request.body.department,
          name: request.body.name,
          phone: request.body.phone,
          birthday: request.body.birthday,
          volunteerId: request.body.volunteerId,
        }).where(eq(members.id, previousMember.id)).run();
        memberId = previousMember.id;
      } else {
        const result = db.insert(members).values({
          studentId: studentId,
          name: request.body.name,
          college: request.body.college,
          department: request.body.department,
          phone: request.body.phone,
          birthday: request.body.birthday,
          volunteerId: request.body.volunteerId,
        }).run();
        memberId = result.lastInsertRowid;
      }

      // Add semester membership
      db.insert(semesterMembers).values({
        semesterId: semesterId,
        memberId: memberId,
        role: request.body.role || '회원',
      }).run();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 등록', request.method, 201, request.body, 'success'));
      return reply.code(201).send(success({ affectedRows: 1 }));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '회원 등록 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // Update member info
  fastify.put('/:studentId', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const semester = util.getCurrentSemester();
      if (!semester) {
        return reply.code(400).send(error('ERR_NO_SEMESTER', '현재 학기 설정이 없습니다.'));
      }

      const member = util.getMemberByStudentId(request.params.studentId);
      if (!member) {
        return reply.code(400).send(error('ERR_NOT_FOUND', '회원을 찾을 수 없습니다.'));
      }

      db.update(members).set({
        college: request.body.college,
        department: request.body.department,
        name: request.body.name,
        phone: request.body.phone,
        birthday: request.body.birthday,
        volunteerId: request.body.volunteerId,
      }).where(eq(members.id, member.id)).run();

      db.update(semesterMembers).set({
        role: request.body.role,
      }).where(and(eq(semesterMembers.memberId, member.id), eq(semesterMembers.semesterId, semester.id))).run();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 정보 수정', request.method, 200, request.body, 'success'));
      return reply.code(200).send(success({ affectedRows: 1 }));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '회원 정보 수정 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // Delete member from current semester
  fastify.delete('/:studentId', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const semester = util.getCurrentSemester();
      if (!semester) {
        return reply.code(400).send(error('ERR_NO_SEMESTER', '현재 학기 설정이 없습니다.'));
      }

      const member = util.getMemberByStudentId(request.params.studentId);
      if (!member) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 삭제', request.method, 400, request.params, 'ERR_NO_MATCHING_ID'));
        return reply.code(400).send(error('ERR_NO_MATCHING_ID', 'No matching ID'));
      }

      const result = db.delete(semesterMembers)
        .where(and(eq(semesterMembers.memberId, member.id), eq(semesterMembers.semesterId, semester.id)))
        .run();

      if(result.changes) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 삭제', request.method, 200, request.params, result));
        return reply.code(200).send(success({ affectedRows: result.changes }));
      }
      else {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 삭제', request.method, 400, request.params, 'ERR_NO_MATCHING_ID'));
        return reply.code(400).send(error('ERR_NO_MATCHING_ID', 'No matching ID'));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '회원 삭제 오류', request.method, 500, request.params, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });
}
