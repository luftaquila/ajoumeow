import { eq, and, or, like, between } from 'drizzle-orm';

import { db } from '../db/index.js';
import { logs } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Log, success, error } from '../controllers/util/interface.js';

export default async function(fastify, opts) {

  fastify.get('/', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const conditions = [];

      if (request.query.level) {
        const levels = Array.isArray(request.query.level) ? request.query.level : [request.query.level];
        conditions.push(or(...levels.map(l => eq(logs.level, l))));
      }

      if (request.query.type) {
        const types = Array.isArray(request.query.type) ? request.query.type : [request.query.type];
        conditions.push(or(...types.map(t => like(logs.ip, `%${t}%`))));
      }

      conditions.push(between(logs.timestamp, request.query.startDate, request.query.endDate));

      const result = db.select().from(logs).where(and(...conditions)).all();
      return reply.code(200).send(success(result));
    }
    catch(e) {
      console.log(e);
      util.logger(new Log('error', request.remoteIP, request.originalPath, '로그 로드 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });
}
