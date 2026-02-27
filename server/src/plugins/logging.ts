import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { logs } from '../db/schema.js';

export default fp(async function loggingPlugin(app: FastifyInstance) {
  app.addHook('onResponse', async (request, reply) => {
    const level = reply.statusCode >= 400 ? 'error' : 'info';

    const ip =
      (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      request.ip;

    try {
      db.insert(logs)
        .values({
          level,
          ip,
          endpoint: request.url,
          method: request.method,
          status: reply.statusCode,
          description: `${request.method} ${request.url} ${reply.statusCode}`,
        })
        .run();
    } catch (err) {
      app.log.error(err, 'Failed to insert request log');
    }
  });

  // Also capture error details in the log
  app.addHook('onError', async (request, _reply, error) => {
    const ip =
      (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      request.ip;

    try {
      db.insert(logs)
        .values({
          level: 'error',
          ip,
          endpoint: request.url,
          method: request.method,
          status: (error as { statusCode?: number }).statusCode ?? 500,
          description: `${request.method} ${request.url} - ${error.message}`,
          query: request.url,
          result: error.stack ?? error.message,
        })
        .run();
    } catch (err) {
      app.log.error(err, 'Failed to insert error log');
    }
  });
});
