import { eq } from 'drizzle-orm';

import { db } from '../db/index.js';
import { settings } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';

export default async function(fastify, opts) {

  fastify.get('/*', async (request, reply) => {
    try {
      let result = util.getSettings(request.params['*']);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '설정값 요청', request.method, 200, request.query, result));
      return reply.code(200).send(new Response('success', null, result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '설정값 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  fastify.put('/*', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      let result = db.update(settings).set({ value: request.body.data }).where(eq(settings.key, request.params['*'])).run();
      util.logger(new Log('info', request.remoteIP, request.originalPath, '설정값 수정', request.method, 200, request.body, result));
      return reply.code(200).send(new Response('success', null, result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '설정값 수정 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });
}
