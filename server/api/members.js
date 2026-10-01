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
