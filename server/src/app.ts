import Fastify from 'fastify';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.get('/api/health', async () => {
    return { status: 'ok' };
  });

  return app;
}
