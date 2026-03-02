import { eq } from 'drizzle-orm';

import { db } from '../db/index.js';
import { settings } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Log, success, error } from '../controllers/util/interface.js';

export default async function(fastify, opts) {

  fastify.get('/:key', async (request, reply) => {
    try {
      const result = util.getSettings(request.params.key);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '설정값 요청', request.method, 200, request.params, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '설정값 요청 오류', request.method, 500, request.params, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  fastify.put('/:key', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      db.update(settings).set({ value: request.body.value }).where(eq(settings.key, request.params.key)).run();
      const result = util.getSettings(request.params.key);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '설정값 수정', request.method, 200, request.body, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '설정값 수정 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });
}
