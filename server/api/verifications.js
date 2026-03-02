import axios from 'axios';
import dateformat from 'dateformat';
import { eq, and, between, desc } from 'drizzle-orm';

import { db } from '../db/index.js';
import { members, semesters, semesterMembers, records, verifications } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Log, success, error } from '../controllers/util/interface.js';

function getVerificationsWithMember(whereClause) {
  return db.select({
    id: verifications.id,
    studentId: members.studentId,
    name: members.name,
    date: verifications.date,
    course: verifications.course,
    score: verifications.score,
    createdAt: verifications.verifiedAt,
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
    studentId: members.studentId,
    name: members.name,
    date: records.date,
    course: records.course,
    createdAt: records.createdAt,
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
      const recordList = getRecordsWithMember(request.query.date);
      const verifyList = getVerificationsWithMember(eq(verifications.date, request.query.date));
      util.logger(new Log('info', request.remoteIP, request.originalPath, '인증 기록 요청', request.method, 200, request.query, verifyList));
      return reply.code(200).send(success({ records: recordList, verifications: verifyList }));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '인증 기록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  fastify.post('/', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      const payload = request.body.items;
      let result = [];
      for(let obj of payload) {
        const member = util.getMemberByStudentId(obj.studentId);
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
      return reply.code(201).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '급식 인증 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  fastify.delete('/', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      const payload = request.body.items;
      let result = [];
      for(let obj of payload) {
        const member = util.getMemberByStudentId(obj.studentId);
        if (!member) continue;
        const att = db.delete(verifications)
          .where(and(eq(verifications.memberId, member.id), eq(verifications.date, obj.date), eq(verifications.course, obj.course)))
          .run();
        result.push(att);
      }
      util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 인증 삭제', request.method, 200, request.body, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '급식 인증 삭제 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  fastify.get('/latest', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      const row = db.select({
        studentId: members.studentId,
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
      return reply.code(200).send(success(row || null));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '최근 급식 인증 날짜 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  function build1365Payload(query) {
    const semester = db.select().from(semesters).where(eq(semesters.name, query.semester)).get();
    if (!semester) return null;

    const verifyRows = db.select({
      studentId: members.studentId,
      name: members.name,
      date: verifications.date,
      course: verifications.course,
      score: verifications.score,
      createdAt: verifications.verifiedAt,
    })
      .from(verifications)
      .innerJoin(members, eq(verifications.memberId, members.id))
      .where(between(verifications.date, query.startDate, query.endDate))
      .orderBy(verifications.date)
      .all();

    const namelist = db.select({
      studentId: members.studentId,
      name: members.name,
      phone: members.phone,
      birthday: members.birthday,
      volunteerId: members.volunteerId,
      role: semesterMembers.role,
    })
      .from(semesterMembers)
      .innerJoin(members, eq(semesterMembers.memberId, members.id))
      .where(eq(semesterMembers.semesterId, semester.id))
      .all();

    const chief = namelist.find(o => o.role == '회장');
    const mask = query.mask == 'true';

    function maskName(name) {
      if (!mask || !name || name.length < 1) return name;
      return name[0] + '**';
    }

    function maskBirthday(birthday) {
      if (!mask || !birthday) return birthday;
      return '******';
    }

    function maskPhone(phone) {
      if (!mask || !phone) return phone;
      const digits = phone.replace(/\D/g, '');
      const last4 = digits.slice(-4);
      return `010-****-${last4}`;
    }

    let rows = [];
    for (const activity of verifyRows) {
      const member = namelist.find(o => o.studentId == activity.studentId);
      if (!member || !member.volunteerId) continue;

      const fmtDate = dateformat(activity.date, 'yyyy.mm.dd');
      const prev = rows.find(data => data.ID == member.studentId && data.date == fmtDate);
      if (prev) prev.hour++;
      else {
        rows.push({
          ID: member.studentId,
          volID: member.volunteerId,
          name: member.name,
          birthday: member.birthday,
          phone: member.phone,
          date: fmtDate,
          hour: 1,
          timestamp: (fmtDate === dateformat(activity.createdAt, 'yyyy.mm.dd')) ? Number(dateformat(activity.createdAt, 'HHMM')) : 1900,
        });
      }
    }

    return { rows, chief, mask, maskName, maskBirthday, maskPhone };
  }

  fastify.get('/1365-export', async (request, reply) => {
    try {
      const result = build1365Payload(request.query);
      if (!result) {
        return reply.code(400).send(error('ERR_SEMESTER_NOT_FOUND', '해당 학기를 찾을 수 없습니다.'));
      }

      const { rows, chief, mask } = result;
      const payload = rows.map(r => ({ ...r, name: mask ? result.maskName(r.name) : r.name }));

      const response = await axios.post('https://script.google.com/macros/s/AKfycbwFchf0CScKD_2A7sTyzRfwODJYYE7Rl9cvc2thvx0Yc2qYKJL7pKZWaEMZ6IWUrlxnnA/exec', {
        data: payload,
        cheif: {
          name: chief ? chief.name : '',
          phone: chief ? chief.phone : ''
        },
        mask: mask
      });

      util.logger(new Log('info', request.remoteIP, request.originalPath, '1365 인증서 생성 요청', request.method, 200, request.query, null));
      return reply.send(response.data);
    }
    catch(e) {
      console.error(e);
      util.logger(new Log('error', request.remoteIP, request.originalPath, '1365 인증서 생성 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  fastify.get('/1365-data', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const result = build1365Payload(request.query);
      if (!result) {
        return reply.code(400).send(error('ERR_SEMESTER_NOT_FOUND', '해당 학기를 찾을 수 없습니다.'));
      }

      const { rows, chief, maskName, maskBirthday, maskPhone } = result;

      const data = {
        rows: rows.map(r => ({
          volID: r.volID,
          name: maskName(r.name),
          birthday: maskBirthday(r.birthday) || '',
          phone: maskPhone(r.phone) || '',
          date: r.date,
          hour: r.hour,
          startTime: r.timestamp,
        })),
        chief: {
          name: chief ? chief.name : '',
          phone: chief ? chief.phone : '',
        },
      };

      util.logger(new Log('info', request.remoteIP, request.originalPath, '1365 인증서 데이터 요청', request.method, 200, request.query, null));
      return reply.code(200).send(success(data));
    }
    catch(e) {
      console.error(e);
      util.logger(new Log('error', request.remoteIP, request.originalPath, '1365 인증서 데이터 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });
}
