import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dateformat from 'dateformat';
import jwt from 'jsonwebtoken';

import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function(fastify, opts) {

  fastify.get('/', async (request, reply) => {
    try {
      let result = await util.query(`SELECT * FROM record WHERE date BETWEEN '${request.query.startDate}' AND '${request.query.endDate} ' ORDER BY date, course, timestamp;`);
      const update = await util.query(`SELECT UPDATE_TIME FROM information_schema.tables WHERE TABLE_SCHEMA='ajoumeow' AND TABLE_name='record';`);

      const token = request.headers['jwt'];
      if(token) {
        try {
          const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
              if (err) reject(err);
              else resolve(decoded);
            });
          });
          result = await maskName(result, decoded.id);
        } catch(err) {
          result = await maskName(result, null);
        }
      }
      else result = await maskName(result, null);

      util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 신청 기록 요청', request.method, 200, request.query, result));
      return reply.code(200).send(new Response('success', update, result));

      async function maskName(data, id) {
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
      const test = await util.query(`SELECT * FROM record WHERE ID=${payload.ID} AND name='${payload.name}' AND date='${payload.date}' AND course='${payload.course}'`);
      if(test.length) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '급식 신청', request.method, 400, request.body, 'ERR_DUP_ENTRY'));
        return reply.code(400).send(new Response('error', '이미 신청되었습니다.', 'ERR_DUP_ENTRY'));
      }
      else {
        const result = await util.query(`INSERT INTO record(ID, name, date, course) VALUES(${payload.ID}, '${payload.name}', '${payload.date}', '${payload.course}');`);
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
      const result = await util.query(`DELETE FROM record WHERE ID=${request.body.ID} AND name='${request.body.name}' AND date='${request.body.date}' AND course='${request.body.course}';`);
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
      switch(request.query.type) {
        case 'summary':
          verify = await util.query(`SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='${dateformat(new Date(), 'yyyymm')}';`);
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
          verify = await util.query(`SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='${dateformat(new Date(), 'yyyymm')}' AND course REGEXP '[0-9]코스';`);
          break;

        case 'this_total':
          verify = await util.query(`SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='${dateformat(new Date(), 'yyyymm')}';`);
          break;

        case 'prev_feeding':
          verify = await util.query(`SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='${dateformat(new Date(new Date().setDate(0)), 'yyyymm')}' AND course REGEXP '[0-9]코스';`);
          break;

        case 'total_total':
          verify = await util.query(`SELECT * FROM verify;`);
          break;

        case 'custom_total':
          let [start, end] = request.query.value.split('|');
          verify = await util.query(`SELECT * FROM verify WHERE date BETWEEN '${start}' AND '${end}';`);
          break;

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
      let check = [];
      if(request.query.level) check.push(`level REGEXP '${request.query.level.join('|')}'`);
      if(request.query.type) check.push(`IP REGEXP '${request.query.type.join('|')}'`);
      check = check.length ? (check.join(' AND ') + ' AND') : '';
      const query = `SELECT * FROM log WHERE ${check} timestamp BETWEEN '${request.query.start}' AND '${request.query.end}';`;
      const result = await util.query(query);
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
      const filePath = path.join(__dirname, '../web/res/map.json');
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
