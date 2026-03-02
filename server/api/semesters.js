import { db } from '../db/index.js';
import { semesters } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Log, success, error } from '../controllers/util/interface.js';

export default async function(fastify, opts) {

  fastify.get('/', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      const rows = db.select({ name: semesters.name }).from(semesters).all();
      const map = rows.map(r => r.name);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '학기 목록 요청', request.method, 200, request.query, map));
      return reply.code(200).send(success(map));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '학기 목록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });
}
