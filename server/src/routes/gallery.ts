import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, sql, desc, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { photos, tags, photoTags, photoLikes, members } from '../db/schema.js';

const photosQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1').transform(Number),
  limit: z.string().regex(/^\d+$/).optional().default('20').transform(Number),
  sort: z.enum(['latest', 'likes']).optional().default('latest'),
  tag: z.string().optional(),
  uploader: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export default async function galleryRoutes(app: FastifyInstance) {
  // GET /api/gallery/tags — all tags with photo count and likes count
  app.get('/api/gallery/tags', async () => {
    const tagList = await db
      .select({
        id: tags.id,
        name: tags.name,
        photoCount: sql<number>`count(${photoTags.photoId})`,
        likesCount: sql<number>`coalesce(sum(${photos.likesCount}), 0)`,
      })
      .from(tags)
      .leftJoin(photoTags, eq(tags.id, photoTags.tagId))
      .leftJoin(photos, eq(photoTags.photoId, photos.id))
      .groupBy(tags.id);

    return { data: tagList };
  });

  // GET /api/gallery/photos?page=&limit=&sort=&tag=&uploader=
  app.get('/api/gallery/photos', async (request, reply) => {
    const parsed = photosQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters',
        statusCode: 400,
      });
    }

    const { page, limit, sort, tag, uploader } = parsed.data;
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: ReturnType<typeof eq>[] = [];
    if (uploader !== undefined) {
      conditions.push(eq(photos.uploaderId, uploader));
    }

    // If filtering by tag, we need to join photo_tags and tags
    if (tag) {
      // Get photo IDs matching the tag
      const taggedPhotoIds = await db
        .select({ photoId: photoTags.photoId })
        .from(photoTags)
        .innerJoin(tags, eq(photoTags.tagId, tags.id))
        .where(eq(tags.name, tag));

      const ids = taggedPhotoIds.map((r) => r.photoId);

      if (ids.length === 0) {
        return { data: [], total: 0, page, limit };
      }

      conditions.push(sql`${photos.id} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`);
    }

    const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    // Count total
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(photos)
      .where(whereClause);

    // Fetch photos with uploader name
    const orderBy = sort === 'likes' ? desc(photos.likesCount) : desc(photos.createdAt);

    const photoList = await db
      .select({
        id: photos.id,
        filename: photos.filename,
        size: photos.size,
        uploaderId: photos.uploaderId,
        uploaderName: members.name,
        createdAt: photos.createdAt,
        likesCount: photos.likesCount,
      })
      .from(photos)
      .innerJoin(members, eq(photos.uploaderId, members.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return { data: photoList, total, page, limit };
  });

  // GET /api/gallery/photos/:id — single photo detail with tags
  app.get('/api/gallery/photos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const photoId = parseInt(id, 10);

    if (isNaN(photoId)) {
      return reply.status(400).send({ error: 'Invalid photo ID', statusCode: 400 });
    }

    // Fetch photo with uploader info
    const [photo] = await db
      .select({
        id: photos.id,
        filename: photos.filename,
        size: photos.size,
        uploaderId: photos.uploaderId,
        uploaderName: members.name,
        createdAt: photos.createdAt,
        likesCount: photos.likesCount,
      })
      .from(photos)
      .innerJoin(members, eq(photos.uploaderId, members.id))
      .where(eq(photos.id, photoId))
      .limit(1);

    if (!photo) {
      return reply.status(404).send({ error: 'Photo not found', statusCode: 404 });
    }

    // Fetch tags for this photo
    const photoTagList = await db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(photoTags)
      .innerJoin(tags, eq(photoTags.tagId, tags.id))
      .where(eq(photoTags.photoId, photoId));

    return {
      ...photo,
      tags: photoTagList,
    };
  });
}
