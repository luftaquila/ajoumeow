import fs from 'fs';
import path from 'path';
import dateformat from 'dateformat';
import jwt from 'jsonwebtoken';
import { eq, and, between, like, sql, desc, asc, max } from 'drizzle-orm';

import { db, sqlite } from '../db/index.js';
import { records, members, verifications, logs } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';


export default async function(fastify, opts) {

  fastify.get('/', async (request, reply) => {
    try {
      let result = db.select({
        id: records.id,
        ID: members.studentId,
        name: members.name,
        date: records.date,
        course: records.course,
        timestamp: records.createdAt,
      })
        .from(records)
        .innerJoin(members, eq(records.memberId, members.id))
        .where(between(records.date, request.query.startDate, request.query.endDate))
        .orderBy(asc(records.date), asc(records.course), asc(records.createdAt))
        .all();

      const updateRow = db.select({ updateTime: max(records.createdAt) }).from(records).get();
      const update = updateRow ? [{ UPDATE_TIME: updateRow.updateTime }] : [{ UPDATE_TIME: null }];

      const token = request.headers['jwt'];
      if(token) {
        try {
          const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
              if (err) reject(err);
              else resolve(decoded);
            });
          });
          result = maskName(result, decoded.id);
        } catch(err) {
          result = maskName(result, null);
        }
      }
      else result = maskName(result, null);

      util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 신청 기록 요청', request.method, 200, request.query, result));
      return reply.code(200).send(new Response('success', update, result));

      function maskName(data, id) {
        if(id) {
          return data;
        }
        else {
          data.forEach(rec => {
            rec.name = rec.name[0] + rec.name.slice(1).replace(/./g , '○');
            rec.ID = null;
            rec.mine = false;
          });
          return data;
        }
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '급식 신청 기록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  fastify.post('/', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      const payload = request.body;
      const member = util.getMemberByStudentId(payload.ID);
      if (!member) {
        return reply.code(400).send(new Response('error', '등록되지 않은 학번입니다.', 'ERR_NOT_REGISTERED'));
      }

      const test = db.select().from(records)
        .where(and(eq(records.memberId, member.id), eq(records.date, payload.date), eq(records.course, payload.course)))
        .all();

      if(test.length) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 신청', request.method, 400, request.body, 'ERR_DUP_ENTRY'));
        return reply.code(400).send(new Response('error', '이미 신청되었습니다.', 'ERR_DUP_ENTRY'));
      }
      else {
        const result = db.insert(records).values({
          memberId: member.id,
          date: payload.date,
          course: payload.course,
        }).run();
        util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 신청', request.method, 201, request.body, result));
        return reply.code(201).send(new Response('success', null, result));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '급식 신청 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  fastify.delete('/', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      const member = util.getMemberByStudentId(request.body.ID);
      if (!member) {
        return reply.code(400).send(new Response('error', '등록되지 않은 학번입니다.', 'ERR_NOT_REGISTERED'));
      }

      const result = db.delete(records)
        .where(and(eq(records.memberId, member.id), eq(records.date, request.body.date), eq(records.course, request.body.course)))
        .run();
      util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 신청 삭제', request.method, 200, request.body, result));
      return reply.code(200).send(new Response('success', null, result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '급식 신청 삭제 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
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
            ID: members.studentId,
          })
            .from(verifications)
            .innerJoin(members, eq(verifications.memberId, members.id))
            .where(like(verifications.date, `${currentMonth}%`))
            .all();

          for(let obj of verify) {
            let person = data.find(o => o.ID == obj.ID);
            if(!person) data.push({ ID: obj.ID });
          }
          const payload = {
            time: verify.length,
            people: data.length
          };

          util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 통계 요청', request.method, 200, request.query, payload));
          return reply.code(200).send(new Response('success', null, payload));

        case 'this_feeding':
          verify = db.select({
            ID: members.studentId,
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
            ID: members.studentId,
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
            ID: members.studentId,
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
            ID: members.studentId,
            name: members.name,
            score: verifications.score,
          })
            .from(verifications)
            .innerJoin(members, eq(verifications.memberId, members.id))
            .all();
          break;

        case 'custom_total': {
          let [start, end] = request.query.value.split('|');
          verify = db.select({
            ID: members.studentId,
            name: members.name,
            score: verifications.score,
          })
            .from(verifications)
            .innerJoin(members, eq(verifications.memberId, members.id))
            .where(between(verifications.date, start, end))
            .all();
          break;
        }

        default:
          util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 통계 요청', request.method, 400, request.query, 'ERR_INVALID_TYPE'));
          return reply.code(400).send(new Response('error', '유효하지 않은 통계 유형입니다.', 'ERR_INVALID_TYPE'));
      }

      for(let obj of verify) {
        let person = data.find(o => o.ID == obj.ID);
        if(person) {
          person.score += Number(obj.score);
          person.count++;
        }
        else {
          data.push({
            ID: obj.ID,
            name: obj.name,
            score: Number(obj.score),
            count: 1
          });
        }
      }
      util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 통계 요청', request.method, 200, request.query, data));
      return reply.code(200).send(new Response('success', null, data));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '급식 통계 요청', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  fastify.get('/log', { preHandler: [util.isAdmin] }, async(request, reply) => {
    try {
      let conditions = [];
      let params = [];

      if(request.query.level) {
        const levels = Array.isArray(request.query.level) ? request.query.level : [request.query.level];
        conditions.push(`(${levels.map(() => 'level = ?').join(' OR ')})`);
        params.push(...levels);
      }
      if(request.query.type) {
        const types = Array.isArray(request.query.type) ? request.query.type : [request.query.type];
        conditions.push(`(${types.map(() => 'ip LIKE ?').join(' OR ')})`);
        params.push(...types.map(t => `%${t}%`));
      }

      let whereClause = conditions.length ? conditions.join(' AND ') + ' AND ' : '';
      const query = `SELECT * FROM logs WHERE ${whereClause}timestamp BETWEEN ? AND ?`;
      params.push(request.query.start, request.query.end);

      const result = sqlite.prepare(query).all(...params);
      return reply.code(200).send(new Response('success', null, result));
    }
    catch(e) {
      console.log(e);
      util.logger(new Log('error', request.remoteIP, request.originalPath, '로그 로드 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  fastify.get('/map', { preHandler: [util.isLogin] }, async(request, reply) => {
    try {
      util.logger(new Log('info', request.remoteIP, request.originalPath, '지도 파일 요청', request.method, 200, request.query, null));
      const filePath = path.join(globalThis.__webRoot, 'res/map.json');
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return reply.code(200).header('content-type', 'application/json').send(content);
    }
    catch(e) {
      console.log(e);
      util.logger(new Log('error', request.remoteIP, request.originalPath, '지도 파일 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });
}
