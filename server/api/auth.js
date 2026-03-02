import jwt from 'jsonwebtoken';

import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';

export default async function(fastify, opts) {

  fastify.post('/login', async (request, reply) => {
    try {
      if(request.body.id) {
        const result = await util.query(`SELECT name, ID, role, 1365ID FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE ID='${request.body.id}';`);
        const semister = await util.getSettings('currentSemister');

        if(result.length) {
          const token = jwt.sign(request.body, process.env.JWT_SECRET, { expiresIn: '365d' });
          const statistics = await util.query(`SELECT date, course, score FROM verify WHERE id=${request.body.id} ORDER BY date DESC;`);
          util.logger(new Log('info', request.remoteIP, request.originalPath, '로그인 요청', request.method, 200, request.body, token));
          return reply.code(200).send(new Response('success', token, { user: result[0], statistics: statistics, semister: semister }));
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
        const result = await util.query(`SELECT name, ID, role, 1365ID FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE ID='${request.decoded.id}';`);
        const semister = await util.getSettings('currentSemister');

        if(result.length) {
          const statistics = await util.query(`SELECT date, course, score FROM verify WHERE id=${request.decoded.id} ORDER BY date DESC;`);
          util.logger(new Log('info', request.remoteIP, request.originalPath, '자동 로그인', request.method, 200, request.decoded, result[0]));
          return reply.code(200).send(new Response('success', null, { user: result[0], statistics: statistics, semister: semister }));
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
