import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import sharp from 'sharp';
import { eq, sql, desc, and, gt } from 'drizzle-orm';
import { db, sqlite } from '../db/index.js';
import { photos, tags, photoTags, photoLikes, members } from '../db/schema.js';
import { authenticate } from '../plugins/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const galleryDir = path.resolve(__dirname, '..', '..', 'data', 'gallery');

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

  // POST /api/gallery/photos — upload a photo with tags
  app.post('/api/gallery/photos', { preHandler: authenticate }, async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded', statusCode: 400 });
    }

    // Validate mime type
    if (!data.mimetype.startsWith('image/')) {
      return reply.status(400).send({ error: 'Only image files are allowed', statusCode: 400 });
    }

    // Generate timestamp-based filename
    const ext = path.extname(data.filename) || '.jpg';
    const timestamp = Date.now();
    const filename = `${timestamp}${ext}`;
    const thumbFilename = `thumb_${filename}`;
    const filePath = path.join(galleryDir, filename);
    const thumbPath = path.join(galleryDir, thumbFilename);

    // Ensure gallery directory exists
    fs.mkdirSync(galleryDir, { recursive: true });

    // Save uploaded file to disk
    const fileBuffer = await data.toBuffer();
    fs.writeFileSync(filePath, fileBuffer);
    const fileSize = fileBuffer.length;

    // Generate thumbnail (1000px width)
    await sharp(fileBuffer).resize({ width: 1000, withoutEnlargement: true }).toFile(thumbPath);

    // Parse tags from multipart fields
    let tagNames: string[] = [];
    if (data.fields.tags) {
      const tagsField = data.fields.tags;
      // Handle single field value
      const rawValue =
        'value' in tagsField ? (tagsField as { value: string }).value : String(tagsField);
      try {
        const parsed = JSON.parse(rawValue);
        if (Array.isArray(parsed)) {
          tagNames = parsed.filter((t): t is string => typeof t === 'string');
        }
      } catch {
        // Ignore invalid JSON — no tags
      }
    }

    // Wrap all DB operations in a transaction
    const uploaderId = request.user.memberId;

    const txn = sqlite.transaction(() => {
      // Insert photo record
      const [inserted] = db
        .insert(photos)
        .values({
          filename,
          size: fileSize,
          uploaderId,
        })
        .returning()
        .all();

      const photoId = inserted.id;

      // Process tags
      for (const tagName of tagNames) {
        // UPSERT tag
        db.insert(tags)
          .values({ name: tagName })
          .onConflictDoNothing({ target: tags.name })
          .run();

        // Get tag ID
        const [tag] = db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName)).all();

        if (tag) {
          db.insert(photoTags).values({ photoId, tagId: tag.id }).run();
        }
      }

      return inserted;
    });

    const result = txn();

    return reply.status(201).send({
      id: result.id,
      filename: result.filename,
      size: result.size,
      uploaderId: result.uploaderId,
      createdAt: result.createdAt,
    });
  });

  // DELETE /api/gallery/photos/:id — delete own photo + related records + files
  app.delete('/api/gallery/photos/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const photoId = parseInt(id, 10);

    if (isNaN(photoId)) {
      return reply.status(400).send({ error: 'Invalid photo ID', statusCode: 400 });
    }

    // Fetch photo to check ownership and get filename
    const [photo] = await db
      .select({ id: photos.id, filename: photos.filename, uploaderId: photos.uploaderId })
      .from(photos)
      .where(eq(photos.id, photoId))
      .limit(1);

    if (!photo) {
      return reply.status(404).send({ error: 'Photo not found', statusCode: 404 });
    }

    if (photo.uploaderId !== request.user.memberId) {
      return reply.status(403).send({ error: 'Only the uploader can delete this photo', statusCode: 403 });
    }

    // Delete DB records in a transaction
    const txn = sqlite.transaction(() => {
      db.delete(photoTags).where(eq(photoTags.photoId, photoId)).run();
      db.delete(photoLikes).where(eq(photoLikes.photoId, photoId)).run();
      db.delete(photos).where(eq(photos.id, photoId)).run();
    });
    txn();

    // Delete files from disk
    const filePath = path.join(galleryDir, photo.filename);
    const thumbPath = path.join(galleryDir, `thumb_${photo.filename}`);

    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // Ignore file deletion errors
    }
    try {
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    } catch {
      // Ignore file deletion errors
    }

    return { success: true };
  });

  // POST /api/gallery/photos/:id/like — IP-based like with 30-day cooldown
  app.post('/api/gallery/photos/:id/like', async (request, reply) => {
    const { id } = request.params as { id: string };
    const photoId = parseInt(id, 10);

    if (isNaN(photoId)) {
      return reply.status(400).send({ error: 'Invalid photo ID', statusCode: 400 });
    }

    // Check photo exists
    const [photo] = await db
      .select({ id: photos.id })
      .from(photos)
      .where(eq(photos.id, photoId))
      .limit(1);

    if (!photo) {
      return reply.status(404).send({ error: 'Photo not found', statusCode: 404 });
    }

    // Get client IP
    const forwarded = request.headers['x-forwarded-for'];
    const ip = forwarded
      ? String(forwarded).split(',')[0].trim()
      : request.ip;

    // Check 30-day cooldown for same IP on this photo
    const thirtyDaysAgo = sql`datetime('now', '-30 days')`;
    const [recentLike] = await db
      .select({ id: photoLikes.id })
      .from(photoLikes)
      .where(
        and(
          eq(photoLikes.photoId, photoId),
          eq(photoLikes.ip, ip),
          gt(photoLikes.createdAt, thirtyDaysAgo),
        ),
      )
      .limit(1);

    if (recentLike) {
      return reply.status(429).send({
        error: 'Already liked this photo within 30 days',
        statusCode: 429,
      });
    }

    // Insert like and increment count in a transaction
    const txn = sqlite.transaction(() => {
      db.insert(photoLikes)
        .values({ photoId, ip })
        .run();

      db.update(photos)
        .set({ likesCount: sql`${photos.likesCount} + 1` })
        .where(eq(photos.id, photoId))
        .run();
    });
    txn();

    return { success: true };
  });
}
