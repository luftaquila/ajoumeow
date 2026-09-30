import dateformat from 'dateformat';
import { eq, and, between, desc, like } from 'drizzle-orm';

import { db, sqlite } from '../db/index.js';
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

  fastify.get('/', { preHandler: [util.isAdmin] }, async (request, reply) => {
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

  fastify.post('/', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const payload = request.body.items;
      let inserted = 0;
      const skipped = [];
      // 같은 회원·날짜·코스(사유) 인증이 이미 있으면 다시 지급하지 않는다
      const insert = sqlite.transaction(() => {
        for(let obj of payload) {
          const member = util.getMemberByStudentId(obj.studentId);
          if (!member) continue;
          const dup = db.select({ id: verifications.id })
            .from(verifications)
            .where(and(eq(verifications.memberId, member.id), eq(verifications.date, obj.date), eq(verifications.course, obj.course)))
            .get();
          if (dup) {
            skipped.push({ studentId: member.studentId, name: member.name, course: obj.course });
            continue;
          }
          db.insert(verifications).values({
            memberId: member.id,
            date: obj.date,
            course: obj.course,
            score: obj.score,
          }).run();
          inserted++;
        }
      });
      insert();
      const result = { inserted, skipped };
      util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 인증', request.method, 201, request.body, result));
      return reply.code(201).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '급식 인증 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  fastify.delete('/', { preHandler: [util.isAdmin] }, async (request, reply) => {
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

  fastify.get('/latest', { preHandler: [util.isAdmin] }, async (request, reply) => {
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

  // 달력 표시용 월별 요약: 날짜마다 신청 수와 그중 인증된 수
  fastify.get('/summary', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const month = String(request.query.month || '');
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return reply.code(400).send(error('ERR_BAD_REQUEST', '월(month)은 YYYY-MM 형식이어야 합니다.'));
      }
      const rows = sqlite.prepare(`
        SELECT r.date,
          COUNT(*) AS records,
          SUM(EXISTS (SELECT 1 FROM verifications v WHERE v.member_id = r.member_id AND v.date = r.date AND v.course = r.course)) AS verified,
          EXISTS (SELECT 1 FROM verifications v WHERE v.date = r.date AND v.course LIKE '%코스') AS processed
        FROM records r
        WHERE r.date LIKE ?
        GROUP BY r.date
        ORDER BY r.date
      `).all(`${month}-%`);
      const result = rows.map(r => ({ date: r.date, records: r.records, verified: r.verified, processed: !!r.processed }));
      util.logger(new Log('info', request.remoteIP, request.originalPath, '월별 인증 요약 요청', request.method, 200, request.query, null));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '월별 인증 요약 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // 최근 N일(어제까지) 중 신청은 있는데 급식 인증을 한 건도 하지 않은 날
  fastify.get('/unverified-dates', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const days = Math.min(Math.max(parseInt(request.query.days) || 30, 1), 365);
      const today = new Date();
      const from = dateformat(new Date(today.getFullYear(), today.getMonth(), today.getDate() - days), 'yyyy-mm-dd');
      const to = dateformat(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), 'yyyy-mm-dd');
      const rows = sqlite.prepare(`
        SELECT r.date, COUNT(*) AS records
        FROM records r
        WHERE r.date BETWEEN ? AND ?
          AND NOT EXISTS (SELECT 1 FROM verifications v WHERE v.date = r.date AND v.course LIKE '%코스')
        GROUP BY r.date
        ORDER BY r.date DESC
      `).all(from, to);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '미인증 날짜 요청', request.method, 200, request.query, rows));
      return reply.code(200).send(success({ days, dates: rows }));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '미인증 날짜 요청 오류', request.method, 500, request.query, e.stack));
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
      .where(and(between(verifications.date, query.startDate, query.endDate), like(verifications.course, '%코스')))
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
    // 확인서에서 빠지는 회원: 해당 학기 명단에 없거나 1365 아이디가 없음
    const excluded = new Map();
    for (const activity of verifyRows) {
      const member = namelist.find(o => o.studentId == activity.studentId);
      if (!member || !member.volunteerId) {
        const entry = excluded.get(activity.studentId) || {
          studentId: activity.studentId,
          name: activity.name,
          reason: member ? 'noVolunteerId' : 'notInSemester',
          count: 0,
        };
        entry.count++;
        excluded.set(activity.studentId, entry);
        continue;
      }

      const fmtDate = dateformat(activity.date, 'yyyy.mm.dd');
      const prev = rows.find(data => data.ID == member.studentId && data.date == fmtDate);
      if (prev) prev.courses.add(activity.course);
      else {
        rows.push({
          ID: member.studentId,
          volID: member.volunteerId,
          name: member.name,
          birthday: member.birthday,
          phone: member.phone,
          date: fmtDate,
          courses: new Set([activity.course]),
          timestamp: (fmtDate === dateformat(activity.createdAt, 'yyyy.mm.dd')) ? Number(dateformat(activity.createdAt, 'HHMM')) : 1900,
        });
      }
    }

    // 하루에 돈 코스 수만큼 설정된 봉사시간을 부여 (표보다 많이 돌면 마지막 값)
    const hourTable = util.parseVolunteerHours(util.getSettings('volunteerHours')) || util.DEFAULT_VOLUNTEER_HOURS;
    for (const row of rows) {
      row.hour = hourTable[Math.min(row.courses.size, hourTable.length) - 1];
    }

    return { rows, chief, excluded: [...excluded.values()], maskName, maskBirthday, maskPhone };
  }

  fastify.get('/1365-data', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const result = build1365Payload(request.query);
      if (!result) {
        return reply.code(400).send(error('ERR_SEMESTER_NOT_FOUND', '해당 학기를 찾을 수 없습니다.'));
      }

      const { rows, chief, excluded, maskName, maskBirthday, maskPhone } = result;

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
        excluded,
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
