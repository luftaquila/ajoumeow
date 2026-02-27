import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { settings } from '../db/schema.js';
import { requireAdmin } from '../plugins/auth.js';

const updateSettingSchema = z.object({
  value: z.string(),
});

export default async function settingsRoutes(app: FastifyInstance) {
  // GET /api/settings/:key — retrieve a setting value by key
  app.get('/api/settings/:key', async (request, reply) => {
    const { key } = request.params as { key: string };

    const [setting] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);

    if (!setting) {
      return reply.status(404).send({ error: 'Setting not found', statusCode: 404 });
    }

    return { key: setting.key, value: setting.value };
  });

  // PUT /api/settings/:key — create or update a setting (admin only)
  app.put(
    '/api/settings/:key',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { key } = request.params as { key: string };

      const parsed = updateSettingSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid request body', statusCode: 400 });
      }

      const { value } = parsed.data;

      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value },
        });

      return { key, value };
    },
  );
}
