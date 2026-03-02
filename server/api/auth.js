import jwt from 'jsonwebtoken';
import { eq, and } from 'drizzle-orm';

import { db } from '../db/index.js';
import { members, semesters, semesterMembers, verifications } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';

function getMemberInfo(studentId) {
  const semester = util.getCurrentSemester();
  if (!semester) return null;

  const rows = db.select({
    name: members.name,
    ID: members.studentId,
    role: semesterMembers.role,
    '1365ID': members.volunteerId,
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
      if(request.body.id) {
        const result = getMemberInfo(request.body.id);
        const semister = util.getSettings('currentSemister');

        if(result) {
          const tokenPayload = { id: request.body.id, memberId: result.memberId, role: result.role };
          const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '365d' });
          const statistics = getStatistics(result.memberId);
          const user = { name: result.name, ID: result.ID, role: result.role, '1365ID': result['1365ID'] };
          util.logger(new Log('info', request.remoteIP, request.originalPath, '로그인 요청', request.method, 200, request.body, token));
          return reply.code(200).send(new Response('success', token, { user, statistics, semister }));
        }
        else {
          util.logger(new Log('info', request.remoteIP, request.originalPath, '로그인 요청', request.method, 400, request.body, 'ERR_NOT_REGISTERED'));
          return reply.code(400).send(new Response('error', '등록되지 않은 학번입니다.', 'ERR_NOT_REGISTERED'));
        }
      }
      else {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '로그인 요청', request.method, 400, request.body, 'ERR_INVALID_ID'));
        return reply.code(400).send(new Response('error', '유효하지 않은 학번입니다.', 'ERR_INVALID_ID'));
      }
    }
    catch(e) {
      console.log(e);
      util.logger(new Log('error', request.remoteIP, request.originalPath, '로그인 요청 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  fastify.post('/autologin', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      if(request.decoded.id) {
        const result = getMemberInfo(request.decoded.id);
        const semister = util.getSettings('currentSemister');

        if(result) {
          const statistics = getStatistics(result.memberId);
          const user = { name: result.name, ID: result.ID, role: result.role, '1365ID': result['1365ID'] };
          util.logger(new Log('info', request.remoteIP, request.originalPath, '자동 로그인', request.method, 200, request.decoded, user));
          return reply.code(200).send(new Response('success', null, { user, statistics, semister }));
        }
        else {
          util.logger(new Log('info', request.remoteIP, request.originalPath, '자동 로그인', request.method, 400, request.decoded, 'ERR_NOT_REGISTERED'));
          return reply.code(400).send(new Response('error', '등록되지 않은 학번입니다.', 'ERR_NOT_REGISTERED'));
        }
      }
      else {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '자동 로그인', request.method, 400, request.decoded, 'ERR_INVALID_ID'));
        return reply.code(400).send(new Response('error', '유효하지 않은 학번입니다.', 'ERR_INVALID_ID'));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '자동 로그인 오류', request.method, 500, request.decoded, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });
}
