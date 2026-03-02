import axios from 'axios';
import dateformat from 'dateformat';
import { eq, and, between, desc } from 'drizzle-orm';

import { db } from '../db/index.js';
import { members, semesters, semesterMembers, records, verifications } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';

function getVerificationsWithMember(whereClause) {
  return db.select({
    id: verifications.id,
    ID: members.studentId,
    name: members.name,
    date: verifications.date,
    course: verifications.course,
    score: verifications.score,
    timestamp: verifications.verifiedAt,
  })
    .from(verifications)
    .innerJoin(members, eq(verifications.memberId, members.id))
    .where(whereClause)
    .orderBy(verifications.course)
    .all();
}

function getRecordsWithMember(date) {
  return db.select({
    id: records.id,
    ID: members.studentId,
    name: members.name,
    date: records.date,
    course: records.course,
    timestamp: records.createdAt,
  })
    .from(records)
    .innerJoin(members, eq(records.memberId, members.id))
    .where(eq(records.date, date))
    .orderBy(records.course)
    .all();
}

export default async function(fastify, opts) {

  fastify.get('/', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      let record = getRecordsWithMember(request.query.date);
      let verify = getVerificationsWithMember(eq(verifications.date, request.query.date));
      util.logger(new Log('info', request.remoteIP, request.originalPath, '인증 기록 요청', request.method, 200, request.query, verify));
      return reply.code(200).send(new Response('success', record, verify));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '인증 기록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  fastify.post('/', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      let payload = JSON.parse(request.body.data);
      let result = [];
      for(let obj of payload) {
        const member = util.getMemberByStudentId(obj.ID);
        if (!member) continue;
        const att = db.insert(verifications).values({
          memberId: member.id,
          date: obj.date,
          course: obj.course,
          score: obj.score,
        }).run();
        result.push(att);
      }
      util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 인증', request.method, 201, request.body, result));
      return reply.code(201).send(new Response('success', null, result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '급식 인증 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  fastify.delete('/', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      let payload = JSON.parse(request.body.data);
      let result = [];
      for(let obj of payload) {
        const member = util.getMemberByStudentId(obj.ID);
        if (!member) continue;
        const att = db.delete(verifications)
          .where(and(eq(verifications.memberId, member.id), eq(verifications.date, obj.date), eq(verifications.course, obj.course)))
          .run();
        result.push(att);
      }
      util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 인증 삭제', request.method, 200, request.body, result));
      return reply.code(200).send(new Response('success', null, result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '급식 인증 삭제 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  fastify.get('/latest', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      const row = db.select({
        ID: members.studentId,
        name: members.name,
        date: verifications.date,
        course: verifications.course,
        score: verifications.score,
      })
        .from(verifications)
        .innerJoin(members, eq(verifications.memberId, members.id))
        .orderBy(desc(verifications.date))
        .limit(1)
        .get();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '최근 급식 인증 날짜 요청', request.method, 200, request.query, row));
      return reply.code(200).send(new Response('success', null, row || null));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '최근 급식 인증 날짜 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  fastify.get('/1365', async (request, reply) => {
    try {
      const semester = db.select().from(semesters).where(eq(semesters.name, request.query.namelist.replace('namelist_', ''))).get();
      if (!semester) {
        return reply.code(400).send(new Response('error', '해당 학기를 찾을 수 없습니다.', 'ERR_SEMESTER_NOT_FOUND'));
      }

      const verifyRows = db.select({
        ID: members.studentId,
        name: members.name,
        date: verifications.date,
        course: verifications.course,
        score: verifications.score,
        timestamp: verifications.verifiedAt,
      })
        .from(verifications)
        .innerJoin(members, eq(verifications.memberId, members.id))
        .where(between(verifications.date, request.query.start, request.query.end))
        .orderBy(verifications.date)
        .all();

      const namelist = db.select({
        ID: members.studentId,
        name: members.name,
        phone: members.phone,
        birthday: members.birthday,
        '1365ID': members.volunteerId,
        role: semesterMembers.role,
      })
        .from(semesterMembers)
        .innerJoin(members, eq(semesterMembers.memberId, members.id))
        .where(eq(semesterMembers.semesterId, semester.id))
        .all();

      const cheif = namelist.find(o => o.role == '회장');
      const mask = request.query.mask == 'true';

      let payload = [];
      for(const activity of verifyRows) {
        const member = namelist.find(o => o.ID == activity.ID);
        if(!member || !member['1365ID']) continue;

        activity.date = dateformat(activity.date, 'yyyy.mm.dd');

        const prev = payload.find(data => data.ID == member.ID && data.date == activity.date);
        if(prev) prev.hour++;
        else {
          payload.push({
            ID: member.ID,
            volID: member['1365ID'],
            name: member.name,
            birthday: member.birthday,
            phone: member.phone,
            date: activity.date,
            hour: 1,
            timestamp: (activity.date === dateformat(activity.timestamp, 'yyyy.mm.dd')) ? dateformat(activity.timestamp, 'HHMM') : 1900
          });
        }
      }

      const response = await axios.post('https://script.google.com/macros/s/AKfycbwFchf0CScKD_2A7sTyzRfwODJYYE7Rl9cvc2thvx0Yc2qYKJL7pKZWaEMZ6IWUrlxnnA/exec', {
        data: payload,
        cheif: {
          name: cheif ? cheif.name : '',
          phone: cheif ? cheif.phone : ''
        },
        mask: mask
      });

      util.logger(new Log('info', request.remoteIP, request.originalPath, '1365 인증서 생성 요청', request.method, 200, request.query, null));
      return reply.send(response.data);
    }
    catch(e) {
      console.error(e);
      util.logger(new Log('error', request.remoteIP, request.originalPath, '1365 인증서 생성 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });
}
