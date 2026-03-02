import axios from 'axios';
import dateformat from 'dateformat';

import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';

export default async function(fastify, opts) {

  fastify.get('/', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      let record = await util.query(`SELECT * FROM record WHERE date='${request.query.date}' ORDER BY course;`);
      let verify = await util.query(`SELECT * FROM verify WHERE date='${request.query.date}' ORDER BY course;`);
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
        let att = await util.query(`INSERT INTO verify(ID, date, name, course, score) VALUES(${obj.ID}, '${obj.date}', '${obj.name}', '${obj.course}', '${obj.score}');`);
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
        let att = await util.query(`DELETE FROM verify WHERE ID=${obj.ID} AND date='${obj.date}' AND name='${obj.name}' AND course='${obj.course}';`);
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
      let result = await util.query(`SELECT * FROM verify ORDER BY date DESC LIMIT 1;`);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '최근 급식 인증 날짜 요청', request.method, 200, request.query, result));
      return reply.code(200).send(new Response('success', null, result[0]));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '최근 급식 인증 날짜 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  fastify.get('/1365', async (request, reply) => {
    try {
      const verify = await util.query(`SELECT * FROM verify WHERE date BETWEEN '${request.query.start}' AND '${request.query.end}' ORDER BY date;`);
      const namelist = await util.query(`SELECT * FROM \`namelist_${request.query.namelist}\`;`);
      const cheif = namelist.find(o => o.role == '회장');
      const mask = request.query.mask == 'true';

      let payload = [];
      for(const activity of verify) {
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
