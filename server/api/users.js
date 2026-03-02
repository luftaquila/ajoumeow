import { eq, and, like } from 'drizzle-orm';

import { db } from '../db/index.js';
import { members, semesters, semesterMembers, registrations } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';

export default async function(fastify, opts) {

  // Get namelist table by semister
  fastify.get('/list', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      if(request.query.semister == 'all') {
        const rows = db.select({ name: semesters.name }).from(semesters).all();
        const map = rows.map(r => `namelist_${r.name}`);
        util.logger(new Log('info', request.remoteIP, request.originalPath, '명단 목록 요청', request.method, 200, request.query, map));
        return reply.code(200).send(new Response('success', null, map));
      }
      else {
        const semester = db.select().from(semesters).where(eq(semesters.name, request.query.semister)).get();
        if (!semester) {
          return reply.code(400).send(new Response('error', '해당 학기를 찾을 수 없습니다.', 'ERR_SEMESTER_NOT_FOUND'));
        }
        const result = db.select({
          college: members.college,
          department: members.department,
          ID: members.studentId,
          name: members.name,
          phone: members.phone,
          birthday: members.birthday,
          '1365ID': members.volunteerId,
          register: semesterMembers.registeredAt,
          role: semesterMembers.role,
        })
          .from(semesterMembers)
          .innerJoin(members, eq(semesterMembers.memberId, members.id))
          .where(eq(semesterMembers.semesterId, semester.id))
          .all();

        util.logger(new Log('info', request.remoteIP, request.originalPath, '명단 요청', request.method, 200, request.query, result));
        return reply.code(200).send(new Response('success', null, result));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '명단 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  // Get users info by name
  fastify.get('/name', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const semester = util.getCurrentSemester();
      if (!semester) {
        return reply.code(400).send(new Response('error', '현재 학기 설정이 없습니다.', 'ERR_NO_SEMESTER'));
      }
      const result = db.select({
        name: members.name,
        ID: members.studentId,
      })
        .from(members)
        .innerJoin(semesterMembers, eq(semesterMembers.memberId, members.id))
        .where(and(eq(semesterMembers.semesterId, semester.id), like(members.name, `%${request.query.query}%`)))
        .all();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '사용자 정보 요청', request.method, 200, request.query, result));
      return reply.code(200).send(new Response('success', null, result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '사용자 정보 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  // Add new user
  fastify.post('/id', async (request, reply) => {
    try {
      const currentSemester = util.getCurrentSemester();
      const studentId = String(request.body['학번']);

      // check if already registered in current semester
      if (currentSemester) {
        const existing = db.select().from(semesterMembers)
          .innerJoin(members, eq(semesterMembers.memberId, members.id))
          .where(and(eq(members.studentId, studentId), eq(semesterMembers.semesterId, currentSemester.id)))
          .get();

        if (existing) {
          util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 등록', request.method, 400, request.body, 'ERR_ALREADY_REGISTERED'));
          return reply.code(400).send(new Response('error', '이미 이번 학기 회원으로 등록되셨습니다.', 'ERR_ALREADY_REGISTERED'));
        }
      }

      // check if user was previously registered (in any semester)
      const previousMember = db.select().from(members).where(eq(members.studentId, studentId)).get();

      // check if user lookuped for previously registered
      if(request.body.lookup) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '기존 회원 등록여부 조회', request.method, 200, request.body, previousMember));
        if(previousMember) {
          // Get the latest semester membership info for the response
          const smInfo = db.select({
            role: semesterMembers.role,
            register: semesterMembers.registeredAt,
          }).from(semesterMembers).where(eq(semesterMembers.memberId, previousMember.id)).limit(1).get();

          return reply.code(200).send(new Response('success', null, {
            college: previousMember.college,
            department: previousMember.department,
            ID: previousMember.studentId,
            name: previousMember.name,
            phone: previousMember.phone,
            birthday: previousMember.birthday,
            '1365ID': previousMember.volunteerId,
            register: smInfo ? smInfo.register : null,
            role: smInfo ? smInfo.role : '회원',
          }));
        }
        else return reply.code(400).send(new Response('error', '기존 회원이 아닙니다.<br>신입 회원으로 등록해 주세요.', 'ERR_NEVER_REGISTERED'));
      }

      if(request.body.new == 'true' && previousMember) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 등록', request.method, 400, request.body, 'ERR_REGISTERED_BEFORE'));
        return reply.code(400).send(new Response('error', '지난 학기에 가입한 적이 있습니다.<br>기존 회원으로 등록해 주세요.', 'ERR_REGISTERED_BEFORE'));
      }
      else if(request.body.new == 'false' && !previousMember) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 등록', request.method, 400, request.body, 'ERR_NEVER_REGISTERED'));
        return reply.code(400).send(new Response('error', '기존 회원이 아닙니다.<br>신입 회원으로 등록해 주세요.', 'ERR_NEVER_REGISTERED'));
      }

      // Ensure current semester exists
      let semesterId;
      if (currentSemester) {
        semesterId = currentSemester.id;
      } else {
        const semesterName = util.getSettings('currentSemister');
        const result = db.insert(semesters).values({ name: semesterName }).run();
        semesterId = result.lastInsertRowid;
      }

      // Insert or update member
      let memberId;
      if (previousMember) {
        // Update existing member info
        db.update(members).set({
          college: request.body['단과대학'],
          department: request.body['학과'],
          name: request.body['이름'],
          phone: request.body['전화번호'],
          birthday: request.body['생년월일'],
          volunteerId: request.body['1365 아이디'],
        }).where(eq(members.id, previousMember.id)).run();
        memberId = previousMember.id;
      } else {
        // Insert new member
        const result = db.insert(members).values({
          studentId: studentId,
          name: request.body['이름'],
          college: request.body['단과대학'],
          department: request.body['학과'],
          phone: request.body['전화번호'],
          birthday: request.body['생년월일'],
          volunteerId: request.body['1365 아이디'],
        }).run();
        memberId = result.lastInsertRowid;
      }

      // Add semester membership
      db.insert(semesterMembers).values({
        semesterId: semesterId,
        memberId: memberId,
        role: request.body['직책'] || '회원',
        registeredAt: request.body['가입 학기'] || new Date().toISOString(),
      }).run();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 등록', request.method, 201, request.body, 'success'));
      return reply.code(201).send(new Response('success', null, { affectedRows: 1 }));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '회원 등록 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  // Modify user info by id
  fastify.put('/id', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const semester = util.getCurrentSemester();
      if (!semester) {
        return reply.code(400).send(new Response('error', '현재 학기 설정이 없습니다.', 'ERR_NO_SEMESTER'));
      }

      const member = util.getMemberByStudentId(request.body.ID);
      if (!member) {
        return reply.code(400).send(new Response('error', '회원을 찾을 수 없습니다.', 'ERR_NOT_FOUND'));
      }

      // Update member info
      db.update(members).set({
        college: request.body.college,
        department: request.body.department,
        name: request.body.name,
        phone: request.body.phone,
        birthday: request.body.birthday,
        volunteerId: request.body['1365ID'],
      }).where(eq(members.id, member.id)).run();

      // Update semester membership
      db.update(semesterMembers).set({
        role: request.body.role,
        registeredAt: request.body.register,
      }).where(and(eq(semesterMembers.memberId, member.id), eq(semesterMembers.semesterId, semester.id))).run();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 정보 수정', request.method, 200, request.body, 'success'));
      return reply.code(200).send(new Response('success', null, { affectedRows: 1 }));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '회원 정보 수정 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  // Delete user by id
  fastify.delete('/id', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const semester = util.getCurrentSemester();
      if (!semester) {
        return reply.code(400).send(new Response('error', '현재 학기 설정이 없습니다.', 'ERR_NO_SEMESTER'));
      }

      const studentId = String(request.body.ID || 0);
      const member = util.getMemberByStudentId(studentId);
      if (!member) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 삭제', request.method, 400, request.body, 'ERR_NO_MATCHING_ID'));
        return reply.code(400).send(new Response('error', 'No matching ID', 'ERR_NO_MATCHING_ID'));
      }

      const result = db.delete(semesterMembers)
        .where(and(eq(semesterMembers.memberId, member.id), eq(semesterMembers.semesterId, semester.id)))
        .run();

      if(result.changes) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 삭제', request.method, 200, request.body, result));
        return reply.code(200).send(new Response('success', null, { affectedRows: result.changes }));
      }
      else {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 삭제', request.method, 400, request.body, 'ERR_NO_MATCHING_ID'));
        return reply.code(400).send(new Response('error', 'No matching ID', 'ERR_NO_MATCHING_ID'));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '회원 삭제 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  // Get register table by semister
  fastify.get('/register', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      if(request.query.semister == 'all') {
        const rows = db.select({ name: semesters.name }).from(semesters).all();
        const map = rows.map(r => `register_${r.name}`);
        util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청자 명단 목록 요청', request.method, 200, request.query, map));
        return reply.code(200).send(new Response('success', null, map));
      }
      else {
        const semester = db.select().from(semesters).where(eq(semesters.name, request.query.semister)).get();
        if (!semester) {
          return reply.code(400).send(new Response('error', '해당 학기를 찾을 수 없습니다.', 'ERR_SEMESTER_NOT_FOUND'));
        }
        const result = db.select({
          timestamp: registrations.createdAt,
          ID: registrations.studentId,
          name: registrations.name,
          college: registrations.college,
          department: registrations.department,
          phone: registrations.phone,
        })
          .from(registrations)
          .where(eq(registrations.semesterId, semester.id))
          .orderBy(registrations.createdAt)
          .all()
          .reverse();

        util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청자 명단 요청', request.method, 200, request.query, result));
        return reply.code(200).send(new Response('success', null, result));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '가입 신청자 명단 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  // register user
  fastify.post('/register', async (request, reply) => {
    try {
      const semesterName = util.getSettings('currentSemister');
      let semester = db.select().from(semesters).where(eq(semesters.name, semesterName)).get();

      // Create semester if not exists
      if (!semester) {
        const result = db.insert(semesters).values({ name: semesterName }).run();
        semester = { id: result.lastInsertRowid, name: semesterName };
      }

      // check if already registered
      const studentId = String(request.body['학번']);
      const test = db.select().from(registrations)
        .where(and(eq(registrations.studentId, studentId), eq(registrations.semesterId, semester.id)))
        .get();

      if(test) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청', request.method, 400, request.body, 'ERR_ALREADY_REGISTERED'));
        return reply.code(400).send(new Response('error', '이미 가입 신청하셨습니다!<br>조금만 기다리시면 임원진이 연락을 드릴 거에요.', 'ERR_ALREADY_REGISTERED'));
      }

      const result = db.insert(registrations).values({
        studentId: studentId,
        name: request.body['이름'],
        college: request.body['단과대학'],
        department: request.body['학과'],
        phone: request.body['연락처'],
        semesterId: semester.id,
      }).run();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청', request.method, 201, request.body, result));
      return reply.code(201).send(new Response('success', null, result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '가입 신청 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });
}
