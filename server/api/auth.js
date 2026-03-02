import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { eq, and } from 'drizzle-orm';

import { db } from '../db/index.js';
import { members, semesters, semesterMembers, verifications, applications } from '../db/schema.js';
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

  fastify.post('/google', async (request, reply) => {
    try {
      const { credential } = request.body;
      if (!credential) {
        return reply.code(400).send(error('ERR_NO_CREDENTIAL', 'Google credential이 필요합니다.'));
      }

      const clientId = util.getSettings('googleClientId');
      if (!clientId) {
        return reply.code(500).send(error('ERR_CONFIG', 'Google OAuth가 설정되지 않았습니다.'));
      }

      const client = new OAuth2Client(clientId);
      let ticket;
      try {
        ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      } catch (e) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, 'Google 토큰 검증 실패', request.method, 401, null, e.message));
        return reply.code(401).send(error('ERR_INVALID_CREDENTIAL', 'Google 인증에 실패했습니다.'));
      }

      const payload = ticket.getPayload();
      const googleId = payload.sub;
      const googleEmail = payload.email;
      const googleName = payload.name;

      const semester = util.getCurrentSemester();

      // Check if member with this googleId exists
      const member = db.select().from(members).where(eq(members.googleId, googleId)).get();

      if (member) {
        // Check if registered in current semester
        if (semester) {
          const sm = db.select().from(semesterMembers)
            .where(and(eq(semesterMembers.memberId, member.id), eq(semesterMembers.semesterId, semester.id)))
            .get();

          if (sm) {
            // authenticated: issue JWT
            const tokenPayload = { id: member.studentId, memberId: member.id, role: sm.role };
            const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '365d' });
            const statistics = getStatistics(member.id);
            const semesterName = util.getSettings('currentSemester');
            const user = { name: member.name, studentId: member.studentId, role: sm.role, volunteerId: member.volunteerId, memberId: member.id };
            util.logger(new Log('info', request.remoteIP, request.originalPath, 'Google 로그인', request.method, 200, { googleId }, token));
            return reply.code(200).send(success({ status: 'authenticated', token, user, statistics, semester: semesterName }));
          }
        }

        // Check if pending application exists for this semester
        if (semester) {
          const pending = db.select().from(applications)
            .where(and(eq(applications.googleId, googleId), eq(applications.semesterId, semester.id), eq(applications.status, 'pending')))
            .get();
          if (pending) {
            util.logger(new Log('info', request.remoteIP, request.originalPath, 'Google 로그인 - 대기중', request.method, 200, { googleId }, 'pending'));
            return reply.code(200).send(success({ status: 'pending', application: pending }));
          }

          const rejected = db.select().from(applications)
            .where(and(eq(applications.googleId, googleId), eq(applications.semesterId, semester.id), eq(applications.status, 'rejected')))
            .get();
          if (rejected) {
            util.logger(new Log('info', request.remoteIP, request.originalPath, 'Google 로그인 - 거절됨', request.method, 200, { googleId }, 'rejected'));
            return reply.code(200).send(success({ status: 'rejected' }));
          }
        }

        // Admin fallback: allow admin emails to access console even with inactive member
        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
        if (adminEmails.includes(googleEmail)) {
          const tokenPayload = { id: googleEmail, role: '관리자' };
          const adminToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '365d' });
          const semesterName = util.getSettings('currentSemester');
          util.logger(new Log('info', request.remoteIP, request.originalPath, '관리자 Google 로그인', request.method, 200, { googleEmail }, 'admin'));
          return reply.code(200).send(success({ status: 'admin', adminToken, googleEmail, googleName, semester: semesterName }));
        }

        // inactive: member exists but not in current semester
        util.logger(new Log('info', request.remoteIP, request.originalPath, 'Google 로그인 - 비활성', request.method, 200, { googleId }, 'inactive'));
        return reply.code(200).send(success({
          status: 'inactive',
          member: {
            studentId: member.studentId,
            name: member.name,
            college: member.college,
            department: member.department,
            phone: member.phone,
            birthday: member.birthday,
            volunteerId: member.volunteerId,
          },
          googleEmail,
          googleName,
        }));
      }

      // No member linked — check for pending/rejected applications
      if (semester) {
        const pending = db.select().from(applications)
          .where(and(eq(applications.googleId, googleId), eq(applications.semesterId, semester.id), eq(applications.status, 'pending')))
          .get();
        if (pending) {
          util.logger(new Log('info', request.remoteIP, request.originalPath, 'Google 로그인 - 대기중', request.method, 200, { googleId }, 'pending'));
          return reply.code(200).send(success({ status: 'pending', application: pending }));
        }

        const rejected = db.select().from(applications)
          .where(and(eq(applications.googleId, googleId), eq(applications.semesterId, semester.id), eq(applications.status, 'rejected')))
          .get();
        if (rejected) {
          util.logger(new Log('info', request.remoteIP, request.originalPath, 'Google 로그인 - 거절됨', request.method, 200, { googleId }, 'rejected'));
          return reply.code(200).send(success({ status: 'rejected' }));
        }
      }

      // Admin fallback: allow admin emails to access console without member record
      const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
      if (adminEmails.includes(googleEmail)) {
        const tokenPayload = { id: googleEmail, role: '관리자' };
        const adminToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '365d' });
        const semesterName = util.getSettings('currentSemester');
        util.logger(new Log('info', request.remoteIP, request.originalPath, '관리자 Google 로그인', request.method, 200, { googleEmail }, 'admin'));
        return reply.code(200).send(success({ status: 'admin', adminToken, googleEmail, googleName, semester: semesterName }));
      }

      // new: no linked member at all
      util.logger(new Log('info', request.remoteIP, request.originalPath, 'Google 로그인 - 신규', request.method, 200, { googleId }, 'new'));
      return reply.code(200).send(success({ status: 'new', googleEmail, googleName }));
    } catch (e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, 'Google 로그인 오류', request.method, 500, null, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // Link Google account to existing member and login
  fastify.post('/link', async (request, reply) => {
    try {
      const { credential, studentId } = request.body;
      if (!credential || !studentId) {
        return reply.code(400).send(error('ERR_MISSING_FIELDS', 'credential과 studentId가 필요합니다.'));
      }

      const clientId = util.getSettings('googleClientId');
      if (!clientId) {
        return reply.code(500).send(error('ERR_CONFIG', 'Google OAuth가 설정되지 않았습니다.'));
      }

      const client = new OAuth2Client(clientId);
      let ticket;
      try {
        ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      } catch (e) {
        return reply.code(401).send(error('ERR_INVALID_CREDENTIAL', 'Google 인증에 실패했습니다.'));
      }

      const payload = ticket.getPayload();
      const googleId = payload.sub;
      const googleEmail = payload.email;

      const member = db.select().from(members).where(eq(members.studentId, String(studentId))).get();
      if (!member) {
        return reply.code(400).send(error('ERR_NOT_FOUND', '해당 학번의 회원을 찾을 수 없습니다.'));
      }

      // Link Google account
      db.update(members).set({ googleId, googleEmail }).where(eq(members.id, member.id)).run();

      // Check current semester membership
      const semester = util.getCurrentSemester();

      // Clean up pending applications for this Google account
      if (semester) {
        db.delete(applications)
          .where(and(eq(applications.googleId, googleId), eq(applications.semesterId, semester.id), eq(applications.status, 'pending')))
          .run();
      }
      if (semester) {
        const sm = db.select().from(semesterMembers)
          .where(and(eq(semesterMembers.memberId, member.id), eq(semesterMembers.semesterId, semester.id)))
          .get();

        if (sm) {
          const tokenPayload = { id: member.studentId, memberId: member.id, role: sm.role };
          const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '365d' });
          const statistics = getStatistics(member.id);
          const semesterName = util.getSettings('currentSemester');
          const user = { name: member.name, studentId: member.studentId, role: sm.role, volunteerId: member.volunteerId, memberId: member.id };
          util.logger(new Log('info', request.remoteIP, request.originalPath, 'Google 계정 연동 + 로그인', request.method, 200, { googleId, studentId }, 'authenticated'));
          return reply.code(200).send(success({ status: 'authenticated', token, user, statistics, semester: semesterName }));
        }
      }

      // Linked but not in current semester
      util.logger(new Log('info', request.remoteIP, request.originalPath, 'Google 계정 연동', request.method, 200, { googleId, studentId }, 'linked'));
      return reply.code(200).send(success({ status: 'linked' }));
    } catch (e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, 'Google 계정 연동 오류', request.method, 500, null, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  fastify.post('/refresh', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      if(request.decoded.id) {
        // Admin-only JWT (no member record)
        if (request.decoded.role === '관리자' && !request.decoded.memberId) {
          const semester = util.getSettings('currentSemester');
          const user = { name: request.decoded.id, studentId: '', role: '관리자' };
          util.logger(new Log('info', request.remoteIP, request.originalPath, '관리자 자동 로그인', request.method, 200, request.decoded, user));
          return reply.code(200).send(success({ user, statistics: [], semester }));
        }

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
