import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyFormbody from '@fastify/formbody';

import auth from './api/auth.js';
import settings from './api/settings.js';
import record from './api/record.js';
import verify from './api/verify.js';
import users from './api/users.js';
import gallery from './api/gallery.js';

import util from './controllers/util/util.js';
import { Log } from './controllers/util/interface.js';

import weatherClient from './controllers/weatherClient.js';
import dbClient from './controllers/dbClient.js';

import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve dist/ directory: Docker build copies it into server/, local dev has it as sibling
const distRoot = fs.existsSync(path.join(__dirname, 'dist'))
  ? path.join(__dirname, 'dist')
  : path.join(__dirname, '..', 'frontend', 'dist');

// Export for other modules (res/ is inside dist/)
globalThis.__distRoot = distRoot;

const fastify = Fastify({ logger: false });

// Register formbody (replaces body-parser urlencoded)
await fastify.register(fastifyFormbody);

// Add hook to set originalPath and remoteIP (replaces Express middleware)
fastify.addHook('onRequest', async (request, reply) => {
  request.originalPath = request.url;
  request.remoteIP = request.headers['x-forwarded-for'] || request.ip;
});

// Register route plugins
await fastify.register(auth, { prefix: '/api/auth' });
await fastify.register(settings, { prefix: '/api/settings' });
await fastify.register(record, { prefix: '/api/record' });
await fastify.register(verify, { prefix: '/api/verify' });
await fastify.register(users, { prefix: '/api/users' });
await fastify.register(gallery, { prefix: '/api/gallery' });

// Serve built frontend files
await fastify.register(fastifyStatic, {
  root: distRoot,
  prefix: '/',
  decorateReply: false,
});

// SPA fallback: serve timetable index.html for unmatched /timetable routes
fastify.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith('/timetable')) {
    return reply.sendFile('timetable/index.html', distRoot);
  }
  reply.code(404).send({ error: 'Not Found' });
});

// Start server
try {
  await fastify.listen({ port: 5710, host: '0.0.0.0' });
  const msg = 'API server is in startup. Listening on :5710';
  console.log(msg);
  util.logger(new Log('info', 'LOCALHOST', '/api', '서버 프로그램 시작', 'internal', 0, null, msg));
} catch (err) {
  console.error(err);
  process.exit(1);
}

weatherClient();
dbClient();
