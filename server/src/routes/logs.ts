import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, like, eq, gte, lte, sql, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { logs } from '../db/schema.js';
import { requireAdmin } from '../plugins/auth.js';

const logsQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  level: z.enum(['info', 'error']).optional(),
  search: z.string().optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('50').transform(Number),
});

export default async function logsRoutes(app: FastifyInstance) {
  // GET /api/logs — query logs with filters and pagination (admin only)
  app.get('/api/logs', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = logsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query parameters', statusCode: 400 });
    }

    const { from, to, level, search, page, limit } = parsed.data;

    const conditions = [];

    if (from) {
      conditions.push(gte(logs.timestamp, `${from} 00:00:00`));
    }
    if (to) {
      conditions.push(lte(logs.timestamp, `${to} 23:59:59`));
    }
    if (level) {
      conditions.push(eq(logs.level, level));
    }
    if (search) {
      conditions.push(like(logs.description, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ total: sql<number>`count(*)` })
      .from(logs)
      .where(whereClause);

    const total = countResult.total;
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(logs)
      .where(whereClause)
      .orderBy(desc(logs.id))
      .limit(limit)
      .offset(offset);

    return {
      logs: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
}
