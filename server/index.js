import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyFormbody from '@fastify/formbody';

import auth from './api/auth.js';
import settingsRoute from './api/settings.js';
import records from './api/records.js';
import verifications from './api/verifications.js';
import members from './api/members.js';
import semestersRoute from './api/semesters.js';
import registrations from './api/registrations.js';
import applicationsRoute from './api/applications.js';
import gallery from './api/gallery.js';
import data from './api/data.js';

import util from './controllers/util/util.js';
import { Log, error } from './controllers/util/interface.js';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { settings as settingsTable } from './db/schema.js';

import weatherClient from './controllers/weatherClient.js';

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

// Global error handler
fastify.setErrorHandler((err, request, reply) => {
  const status = err.statusCode || 500;
  util.logger(new Log('error', request.remoteIP, request.originalPath, err.message, request.method, status, null, err.stack));
  reply.code(status).send(error(err.code || 'ERR_UNKNOWN', err.message || '알 수 없는 오류'));
});

// Register route plugins
await fastify.register(auth, { prefix: '/api/auth' });
await fastify.register(settingsRoute, { prefix: '/api/settings' });
await fastify.register(records, { prefix: '/api/records' });
await fastify.register(verifications, { prefix: '/api/verifications' });
await fastify.register(members, { prefix: '/api/members' });
await fastify.register(semestersRoute, { prefix: '/api/semesters' });
await fastify.register(registrations, { prefix: '/api/registrations' });
await fastify.register(applicationsRoute, { prefix: '/api/applications' });
await fastify.register(gallery, { prefix: '/api/gallery' });
await fastify.register(data, { prefix: '/api/data' });

// Serve built frontend files
await fastify.register(fastifyStatic, {
  root: distRoot,
  prefix: '/',
  redirect: true,
});

// SPA fallback: serve index.html for unmatched SPA routes
fastify.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith('/timetable')) {
    return reply.sendFile('timetable/index.html', distRoot);
  }
  if (request.url.startsWith('/console')) {
    return reply.sendFile('console/index.html', distRoot);
  }
  reply.code(404).send(error('ERR_NOT_FOUND', 'Not Found'));
});

// Seed static JSON data into settings table
const dataKeys = ['college', 'map', 'weather'];
for (const key of dataKeys) {
  if (!util.getSettings(key)) {
    const filePath = path.join(distRoot, `res/${key}.json`);
    if (fs.existsSync(filePath)) {
      db.insert(settingsTable).values({ key, value: fs.readFileSync(filePath, 'utf-8') }).run();
    }
  }
}

// Migrate settings key: currentSemister → currentSemester
try {
  const { sqlite } = await import('./db/index.js');
  sqlite.prepare(`UPDATE settings SET key = 'currentSemester' WHERE key = 'currentSemister'`).run();
} catch (_) {}

// Migrate: add google_id, google_email columns to members
try {
  const { sqlite } = await import('./db/index.js');
  sqlite.prepare(`ALTER TABLE members ADD COLUMN google_id TEXT`).run();
  sqlite.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS members_google_id_unique ON members(google_id)`).run();
} catch (_) {}
try {
  const { sqlite } = await import('./db/index.js');
  sqlite.prepare(`ALTER TABLE members ADD COLUMN google_email TEXT`).run();
} catch (_) {}

// Migrate: create applications table
{
  const { sqlite } = await import('./db/index.js');
  sqlite.prepare(`CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT NOT NULL,
    google_email TEXT NOT NULL,
    google_name TEXT,
    student_id TEXT NOT NULL,
    name TEXT NOT NULL,
    college TEXT NOT NULL,
    department TEXT NOT NULL,
    phone TEXT NOT NULL,
    birthday TEXT,
    volunteer_id TEXT,
    is_new INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    semester_id INTEGER NOT NULL REFERENCES semesters(id),
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )`).run();
}

// Sync googleClientId setting from env
if (process.env.GOOGLE_CLIENT_ID) {
  const current = util.getSettings('googleClientId');
  if (!current) {
    db.insert(settingsTable).values({ key: 'googleClientId', value: process.env.GOOGLE_CLIENT_ID }).run();
  } else if (current !== process.env.GOOGLE_CLIENT_ID) {
    db.update(settingsTable).set({ value: process.env.GOOGLE_CLIENT_ID }).where(eq(settingsTable.key, 'googleClientId')).run();
  }
}

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
