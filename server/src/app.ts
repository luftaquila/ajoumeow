import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import loggingPlugin from './plugins/logging.js';
import authPlugin from './plugins/auth.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import recordsRoutes from './routes/records.js';
import verifyRoutes from './routes/verify.js';
import settingsRoutes from './routes/settings.js';
import galleryRoutes from './routes/gallery.js';
import logsRoutes from './routes/logs.js';
import weatherRoutes from './routes/weather.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // CORS
  await app.register(cors, {
    origin: true,
  });

  // Serve gallery images from server/data/gallery/
  const galleryDir = path.resolve(__dirname, '..', 'data', 'gallery');
  await app.register(fastifyStatic, {
    root: galleryDir,
    prefix: '/gallery/',
    decorateReply: true,
  });

  // Multipart file upload support
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  });

  // Auth plugin (decorates request with user property)
  await app.register(authPlugin);

  // Request logging (logs every request to the DB)
  await app.register(loggingPlugin);

  // Global error handler — consistent JSON error responses
  app.setErrorHandler<FastifyError>((error, _request, reply) => {
    const statusCode = error.statusCode ?? 500;
    app.log.error(error);
    reply.status(statusCode).send({
      error: error.message || 'Internal Server Error',
      statusCode,
    });
  });

  // Health check
  app.get('/api/health', async () => {
    return { status: 'ok' };
  });

  // Routes
  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(recordsRoutes);
  await app.register(verifyRoutes);
  await app.register(settingsRoutes);
  await app.register(galleryRoutes);
  await app.register(logsRoutes);
  await app.register(weatherRoutes);

  return app;
}
