import { eq, and, desc } from 'drizzle-orm';

import { db } from '../db/index.js';
import { semesters, registrations } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Log, success, error } from '../controllers/util/interface.js';

export default async function(fastify, opts) {

  // Get semester list for registrations
  fastify.get('/semesters', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const rows = db.select({ name: semesters.name }).from(semesters).all();
      const map = rows.map(r => r.name);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청자 명단 목록 요청', request.method, 200, request.query, map));
      return reply.code(200).send(success(map));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '가입 신청자 명단 목록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // Get registrations by semester
  fastify.get('/', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const semester = db.select().from(semesters).where(eq(semesters.name, request.query.semester)).get();
      if (!semester) {
        return reply.code(400).send(error('ERR_SEMESTER_NOT_FOUND', '해당 학기를 찾을 수 없습니다.'));
      }
      const result = db.select({
        createdAt: registrations.createdAt,
        studentId: registrations.studentId,
        name: registrations.name,
        college: registrations.college,
        department: registrations.department,
        phone: registrations.phone,
      })
        .from(registrations)
        .where(eq(registrations.semesterId, semester.id))
        .orderBy(desc(registrations.createdAt))
        .all();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청자 명단 요청', request.method, 200, request.query, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '가입 신청자 명단 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // Submit registration
  fastify.post('/', async (request, reply) => {
    try {
      const semesterName = util.getSettings('currentSemester');
      let semester = db.select().from(semesters).where(eq(semesters.name, semesterName)).get();

      if (!semester) {
        const result = db.insert(semesters).values({ name: semesterName }).run();
        semester = { id: result.lastInsertRowid, name: semesterName };
      }

      const studentId = String(request.body.studentId);
      const test = db.select().from(registrations)
        .where(and(eq(registrations.studentId, studentId), eq(registrations.semesterId, semester.id)))
        .get();

      if(test) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청', request.method, 400, request.body, 'ERR_ALREADY_REGISTERED'));
        return reply.code(400).send(error('ERR_ALREADY_REGISTERED', '이미 가입 신청하셨습니다!<br>조금만 기다리시면 임원진이 연락을 드릴 거에요.'));
      }

      const result = db.insert(registrations).values({
        studentId: studentId,
        name: request.body.name,
        college: request.body.college,
        department: request.body.department,
        phone: request.body.phone,
        semesterId: semester.id,
      }).run();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청', request.method, 201, request.body, result));
      return reply.code(201).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '가입 신청 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });
}
