import jwt from 'jsonwebtoken';
import { eq, and } from 'drizzle-orm';

import { db } from '../db/index.js';
import { members, semesters, semesterMembers, verifications } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Log, success, error } from '../controllers/util/interface.js';

function getMemberInfo(studentId) {
  const semester = util.getCurrentSemester();
  if (!semester) return null;

  const rows = db.select({
    name: members.name,
    studentId: members.studentId,
    role: semesterMembers.role,
    volunteerId: members.volunteerId,
    memberId: members.id,
  })
    .from(members)
    .innerJoin(semesterMembers, eq(semesterMembers.memberId, members.id))
    .where(and(eq(members.studentId, String(studentId)), eq(semesterMembers.semesterId, semester.id)))
    .all();

  return rows.length ? rows[0] : null;
}

function getStatistics(memberId) {
  return db.select({
    date: verifications.date,
    course: verifications.course,
    score: verifications.score,
  })
    .from(verifications)
    .where(eq(verifications.memberId, memberId))
    .orderBy(verifications.date)
    .all()
    .reverse();
}

export default async function(fastify, opts) {

  fastify.post('/login', async (request, reply) => {
    try {
      if(request.body.studentId) {
        const result = getMemberInfo(request.body.studentId);
        const semester = util.getSettings('currentSemester');

        if(result) {
          const tokenPayload = { id: request.body.studentId, memberId: result.memberId, role: result.role };
          const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '365d' });
          const statistics = getStatistics(result.memberId);
          const user = { name: result.name, studentId: result.studentId, role: result.role, volunteerId: result.volunteerId, memberId: result.memberId };
          util.logger(new Log('info', request.remoteIP, request.originalPath, '로그인 요청', request.method, 200, request.body, token));
          return reply.code(200).send(success({ token, user, statistics, semester }));
        }
        else {
          util.logger(new Log('info', request.remoteIP, request.originalPath, '로그인 요청', request.method, 400, request.body, 'ERR_NOT_REGISTERED'));
          return reply.code(400).send(error('ERR_NOT_REGISTERED', '등록되지 않은 학번입니다.'));
        }
      }
      else {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '로그인 요청', request.method, 400, request.body, 'ERR_INVALID_ID'));
        return reply.code(400).send(error('ERR_INVALID_ID', '유효하지 않은 학번입니다.'));
      }
    }
    catch(e) {
      console.log(e);
      util.logger(new Log('error', request.remoteIP, request.originalPath, '로그인 요청 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  fastify.post('/refresh', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      if(request.decoded.id) {
        const result = getMemberInfo(request.decoded.id);
        const semester = util.getSettings('currentSemester');

        if(result) {
          const statistics = getStatistics(result.memberId);
          const user = { name: result.name, studentId: result.studentId, role: result.role, volunteerId: result.volunteerId, memberId: result.memberId };
          util.logger(new Log('info', request.remoteIP, request.originalPath, '자동 로그인', request.method, 200, request.decoded, user));
          return reply.code(200).send(success({ user, statistics, semester }));
        }
        else {
          util.logger(new Log('info', request.remoteIP, request.originalPath, '자동 로그인', request.method, 400, request.decoded, 'ERR_NOT_REGISTERED'));
          return reply.code(400).send(error('ERR_NOT_REGISTERED', '등록되지 않은 학번입니다.'));
        }
      }
      else {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '자동 로그인', request.method, 400, request.decoded, 'ERR_INVALID_ID'));
        return reply.code(400).send(error('ERR_INVALID_ID', '유효하지 않은 학번입니다.'));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '자동 로그인 오류', request.method, 500, request.decoded, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });
}
