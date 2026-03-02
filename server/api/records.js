import fs from 'fs';
import path from 'path';
import dateformat from 'dateformat';
import { eq, and, between, like, asc, max } from 'drizzle-orm';

import { db } from '../db/index.js';
import { records, members, verifications } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Log, success, error } from '../controllers/util/interface.js';

export default async function(fastify, opts) {

  fastify.get('/', { preHandler: [util.optionalAuth] }, async (request, reply) => {
    try {
      let result = db.select({
        id: records.id,
        studentId: members.studentId,
        name: members.name,
        date: records.date,
        course: records.course,
        createdAt: records.createdAt,
      })
        .from(records)
        .innerJoin(members, eq(records.memberId, members.id))
        .where(between(records.date, request.query.startDate, request.query.endDate))
        .orderBy(asc(records.date), asc(records.course), asc(records.createdAt))
        .all();

      const updateRow = db.select({ updateTime: max(records.createdAt) }).from(records).get();
      const lastUpdatedAt = updateRow ? updateRow.updateTime : null;

      if (request.decoded && request.decoded.id) {
        // Logged in: show full data
      } else {
        // Not logged in: mask names
        result = result.map(rec => ({
          ...rec,
          name: rec.name[0] + rec.name.slice(1).replace(/./g, '○'),
          studentId: null,
          mine: false,
        }));
      }

      util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 신청 기록 요청', request.method, 200, request.query, result));
      return reply.code(200).send(success(result, { lastUpdatedAt }));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '급식 신청 기록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  fastify.post('/', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      const payload = request.body;
      const member = util.getMemberByStudentId(payload.studentId);
      if (!member) {
        return reply.code(400).send(error('ERR_NOT_REGISTERED', '등록되지 않은 학번입니다.'));
      }

      const test = db.select().from(records)
        .where(and(eq(records.memberId, member.id), eq(records.date, payload.date), eq(records.course, payload.course)))
        .all();

      if(test.length) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 신청', request.method, 400, request.body, 'ERR_DUP_ENTRY'));
        return reply.code(400).send(error('ERR_DUP_ENTRY', '이미 신청되었습니다.'));
      }
      else {
        const result = db.insert(records).values({
          memberId: member.id,
          date: payload.date,
          course: payload.course,
        }).run();
        util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 신청', request.method, 201, request.body, result));
        return reply.code(201).send(success(result));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '급식 신청 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  fastify.delete('/:id', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      const recordId = Number(request.params.id);
      const record = db.select().from(records).where(eq(records.id, recordId)).get();
      if (!record) {
        return reply.code(404).send(error('ERR_NOT_FOUND', '신청 기록을 찾을 수 없습니다.'));
      }

      // Verify ownership
      const memberId = util.resolveMemberId(request.decoded);
      if (record.memberId !== memberId) {
        return reply.code(403).send(error('ERR_FORBIDDEN', '본인의 신청만 삭제할 수 있습니다.'));
      }

      const result = db.delete(records).where(eq(records.id, recordId)).run();
      util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 신청 삭제', request.method, 200, request.params, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '급식 신청 삭제 오류', request.method, 500, request.params, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  fastify.get('/statistics', async (request, reply) => {
    try {
      let data = [], verify = null;
      const currentMonth = dateformat(new Date(), 'yyyy-mm');
      const prevMonth = dateformat(new Date(new Date().setDate(0)), 'yyyy-mm');

      switch(request.query.type) {
        case 'summary':
          verify = db.select({
            studentId: members.studentId,
          })
            .from(verifications)
            .innerJoin(members, eq(verifications.memberId, members.id))
            .where(like(verifications.date, `${currentMonth}%`))
            .all();

          for(let obj of verify) {
            let person = data.find(o => o.studentId == obj.studentId);
            if(!person) data.push({ studentId: obj.studentId });
          }
          const payload = {
            totalHours: verify.length,
            uniqueMembers: data.length
          };

          util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 통계 요청', request.method, 200, request.query, payload));
          return reply.code(200).send(success(payload));

        case 'this_feeding':
          verify = db.select({
            studentId: members.studentId,
            name: members.name,
            score: verifications.score,
          })
            .from(verifications)
            .innerJoin(members, eq(verifications.memberId, members.id))
            .where(and(like(verifications.date, `${currentMonth}%`), like(verifications.course, '%코스')))
            .all();
          break;

        case 'this_total':
          verify = db.select({
            studentId: members.studentId,
            name: members.name,
            score: verifications.score,
          })
            .from(verifications)
            .innerJoin(members, eq(verifications.memberId, members.id))
            .where(like(verifications.date, `${currentMonth}%`))
            .all();
          break;

        case 'prev_feeding':
          verify = db.select({
            studentId: members.studentId,
            name: members.name,
            score: verifications.score,
          })
            .from(verifications)
            .innerJoin(members, eq(verifications.memberId, members.id))
            .where(and(like(verifications.date, `${prevMonth}%`), like(verifications.course, '%코스')))
            .all();
          break;

        case 'total_total':
          verify = db.select({
            studentId: members.studentId,
            name: members.name,
            score: verifications.score,
          })
            .from(verifications)
            .innerJoin(members, eq(verifications.memberId, members.id))
            .all();
          break;

        case 'custom_total': {
          verify = db.select({
            studentId: members.studentId,
            name: members.name,
            score: verifications.score,
          })
            .from(verifications)
            .innerJoin(members, eq(verifications.memberId, members.id))
            .where(between(verifications.date, request.query.startDate, request.query.endDate))
            .all();
          break;
        }

        default:
          util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 통계 요청', request.method, 400, request.query, 'ERR_INVALID_TYPE'));
          return reply.code(400).send(error('ERR_INVALID_TYPE', '유효하지 않은 통계 유형입니다.'));
      }

      for(let obj of verify) {
        let person = data.find(o => o.studentId == obj.studentId);
        if(person) {
          person.score += Number(obj.score);
          person.count++;
        }
        else {
          data.push({
            studentId: obj.studentId,
            name: obj.name,
            score: Number(obj.score),
            count: 1
          });
        }
      }
      util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 통계 요청', request.method, 200, request.query, data));
      return reply.code(200).send(success(data));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '급식 통계 요청', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  fastify.get('/map', { preHandler: [util.isLogin] }, async(request, reply) => {
    try {
      util.logger(new Log('info', request.remoteIP, request.originalPath, '지도 파일 요청', request.method, 200, request.query, null));
      const filePath = path.join(globalThis.__distRoot, 'res/map.json');
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return reply.code(200).header('content-type', 'application/json').send(content);
    }
    catch(e) {
      console.log(e);
      util.logger(new Log('error', request.remoteIP, request.originalPath, '지도 파일 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });
}
