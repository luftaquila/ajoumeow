import { eq } from 'drizzle-orm';

import { db } from '../db/index.js';
import { settings } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Log, error } from '../controllers/util/interface.js';

const ALLOWED_KEYS = ['college', 'map', 'weather'];

export default async function(fastify, opts) {

  fastify.get('/:key', async (request, reply) => {
    try {
      const { key } = request.params;
      if (!ALLOWED_KEYS.includes(key)) {
        return reply.code(404).send(error('ERR_NOT_FOUND', '존재하지 않는 데이터입니다.'));
      }

      const value = util.getSettings(key);
      if (value == null) {
        return reply.code(404).send(error('ERR_NOT_FOUND', '데이터가 없습니다.'));
      }

      util.logger(new Log('info', request.remoteIP, request.originalPath, '데이터 조회', request.method, 200, request.params, null));
      return reply.code(200).header('content-type', 'application/json').send(value);
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '데이터 조회 오류', request.method, 500, request.params, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  fastify.put('/:key', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const { key } = request.params;
      if (!ALLOWED_KEYS.includes(key)) {
        return reply.code(404).send(error('ERR_NOT_FOUND', '존재하지 않는 데이터입니다.'));
      }

      const value = JSON.stringify(request.body);
      db.update(settings).set({ value }).where(eq(settings.key, key)).run();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '데이터 수정', request.method, 200, request.params, null));
      return reply.code(200).header('content-type', 'application/json').send(value);
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '데이터 수정 오류', request.method, 500, request.params, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });
}
