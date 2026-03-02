import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import sharp from 'sharp';
import dateformat from 'dateformat';
import { eq, and, desc, asc, sql, count } from 'drizzle-orm';

import { db, sqlite } from '../db/index.js';
import { members, photos, tags, photoTags } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Log, success, error } from '../controllers/util/interface.js';

function getPhotoWithDetails(photoRow) {
  const tagRows = db.select({ name: tags.name })
    .from(photoTags)
    .innerJoin(tags, eq(photoTags.tagId, tags.id))
    .where(eq(photoTags.photoId, photoRow.id))
    .all();

  const uploader = db.select({ name: members.name })
    .from(members)
    .where(eq(members.id, photoRow.uploaderId))
    .get();

  return {
    photoId: photoRow.filename,
    size: photoRow.size,
    uploaderId: photoRow.uploaderId,
    uploaderName: uploader ? uploader.name : '',
    createdAt: photoRow.createdAt,
    likes: photoRow.likesCount,
    tags: tagRows.map(t => t.name),
  };
}

function getPhotosListWithDetails(photoRows) {
  return photoRows.map(row => getPhotoWithDetails(row));
}

export default async function(fastify, opts) {
  const galleryDir = path.join(globalThis.__distRoot, 'res/image/gallery');
  await fastify.register(import('@fastify/multipart'), { limits: { fileSize: 50 * 1024 * 1024 } });

  // GET /api/gallery/tags
  fastify.get('/tags', async (request, reply) => {
    try {
      const result = db.select({
        tagName: tags.name,
        photoCount: count(photoTags.photoId),
        likes: sql`COALESCE(SUM(${photos.likesCount}), 0)`.as('likes'),
      })
        .from(tags)
        .leftJoin(photoTags, eq(photoTags.tagId, tags.id))
        .leftJoin(photos, eq(photoTags.photoId, photos.id))
        .groupBy(tags.id)
        .all();

      for (const tag of result) {
        const newest = db.select({ filename: photos.filename })
          .from(photoTags)
          .innerJoin(tags, eq(photoTags.tagId, tags.id))
          .innerJoin(photos, eq(photoTags.photoId, photos.id))
          .where(eq(tags.name, tag.tagName))
          .orderBy(desc(photos.id))
          .limit(1)
          .get();
        tag.newestPhotoId = newest ? newest.filename : null;
      }

      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 태그 목록 요청', request.method, 200, request.query, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 태그 목록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // GET /api/gallery/photos/:photoId — single photo detail
  fastify.get('/photos/:photoId', async (request, reply) => {
    try {
      const photo = db.select().from(photos).where(eq(photos.filename, request.params.photoId)).get();
      if (!photo) return reply.code(404).send(error('ERR_NOT_FOUND', '사진을 찾을 수 없습니다.'));
      const result = getPhotoWithDetails(photo);

      util.logger(new Log('info', request.remoteIP, request.originalPath, '사진 세부정보 요청', request.method, 200, request.params, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '사진 세부정보 요청 오류', request.method, 500, request.params, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // GET /api/gallery/photos — photo list (gallery)
  fastify.get('/photos', async (request, reply) => {
    const orderCol = request.query.sort === 'popular' ? desc(photos.likesCount) : desc(photos.id);
    try {
      const photoRows = db.select().from(photos)
        .orderBy(orderCol)
        .limit(10)
        .offset(Number(request.query.offset || 0))
        .all();

      const result = getPhotosListWithDetails(photoRows);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진 목록 요청', request.method, 200, request.query, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 목록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // GET /api/gallery/uploaders — uploader list
  fastify.get('/uploaders', async (request, reply) => {
    try {
      const uploaderRows = db.select({
        uploaderId: photos.uploaderId,
        uploaderName: members.name,
        photoCount: count(photos.id),
        likes: sql`SUM(${photos.likesCount})`.as('likes'),
      })
        .from(photos)
        .innerJoin(members, eq(photos.uploaderId, members.id))
        .groupBy(photos.uploaderId)
        .orderBy(request.query.sort === 'popular' ? sql`likes DESC` : sql`MAX(${photos.id}) DESC`, asc(members.name))
        .limit(10)
        .offset(Number(request.query.offset || 0))
        .all();

      // Add newestPhotoId for each uploader
      for (const u of uploaderRows) {
        const newest = db.select({ filename: photos.filename })
          .from(photos)
          .where(eq(photos.uploaderId, u.uploaderId))
          .orderBy(desc(photos.id))
          .limit(1)
          .get();
        u.newestPhotoId = newest ? newest.filename : null;
      }

      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진작가 목록 요청', request.method, 200, request.query, uploaderRows));
      return reply.code(200).send(success(uploaderRows));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 사진작가 목록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // GET /api/gallery/uploaders/:id/photos
  fastify.get('/uploaders/:id/photos', async (request, reply) => {
    const orderCol = request.query.sort === 'popular' ? desc(photos.likesCount) : desc(photos.id);
    try {
      const photoRows = db.select().from(photos)
        .where(eq(photos.uploaderId, Number(request.params.id)))
        .orderBy(orderCol)
        .limit(10)
        .offset(Number(request.query.offset || 0))
        .all();

      const result = getPhotosListWithDetails(photoRows);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진작가 사진 목록 요청', request.method, 200, request.query, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 사진작가 사진 목록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // GET /api/gallery/cats — cat (tag) list
  fastify.get('/cats', async (request, reply) => {
    try {
      const catRows = db.select({
        tagName: tags.name,
        photoCount: count(photoTags.photoId),
        likes: sql`COALESCE(SUM(${photos.likesCount}), 0)`.as('likes'),
      })
        .from(tags)
        .innerJoin(photoTags, eq(photoTags.tagId, tags.id))
        .innerJoin(photos, eq(photoTags.photoId, photos.id))
        .groupBy(tags.id)
        .orderBy(request.query.sort === 'popular' ? sql`likes DESC` : sql`MAX(${photos.id}) DESC`, asc(tags.name))
        .limit(10)
        .offset(Number(request.query.offset || 0))
        .all();

      // Add newestPhotoId for each cat
      for (const c of catRows) {
        const newest = db.select({ filename: photos.filename })
          .from(photoTags)
          .innerJoin(tags, eq(photoTags.tagId, tags.id))
          .innerJoin(photos, eq(photoTags.photoId, photos.id))
          .where(eq(tags.name, c.tagName))
          .orderBy(desc(photos.id))
          .limit(1)
          .get();
        c.newestPhotoId = newest ? newest.filename : null;
      }

      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 태그 목록 요청', request.method, 200, request.query, catRows));
      return reply.code(200).send(success(catRows));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 태그 목록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // GET /api/gallery/tags/:name/photos
  fastify.get('/tags/:name/photos', async (request, reply) => {
    try {
      const tag = db.select().from(tags).where(eq(tags.name, request.params.name)).get();
      if (!tag) return reply.code(200).send(success([]));

      const photoIds = db.select({ photoId: photoTags.photoId })
        .from(photoTags)
        .where(eq(photoTags.tagId, tag.id))
        .orderBy(desc(photoTags.photoId))
        .limit(10)
        .offset(Number(request.query.offset || 0))
        .all();

      const result = [];
      for (const { photoId } of photoIds) {
        const photo = db.select().from(photos).where(eq(photos.id, photoId)).get();
        if (photo) result.push(getPhotoWithDetails(photo));
      }

      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 태그 사진 목록 요청', request.method, 200, request.query, result));
      return reply.code(200).send(success(result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 태그 사진 목록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // POST /api/gallery/photos — upload
  fastify.post('/photos', { preHandler: [util.isLogin] }, async (request, reply) => {
    let savedFilePath = null;
    let savedThumbPath = null;
    try {
      const parts = request.parts();
      let fileInfo = null;
      const fields = {};

      for await (const part of parts) {
        if (part.type === 'file') {
          const filename = new Date().getTime() + path.extname(part.filename);
          const filepath = path.join(galleryDir, filename);
          await pipeline(part.file, fs.createWriteStream(filepath));
          const stat = await fs.promises.stat(filepath);
          fileInfo = { filename, path: filepath, size: stat.size, destination: galleryDir };
          savedFilePath = filepath;
        } else {
          fields[part.fieldname] = part.value;
        }
      }

      const thumbPath = path.join(fileInfo.destination, 'thumb_' + fileInfo.filename);
      await sharp(fileInfo.path).resize(1000).withMetadata().toFile(thumbPath);
      savedThumbPath = thumbPath;

      const memberId = util.resolveMemberId(request.decoded);

      const uploadTx = sqlite.transaction(() => {
        const photoResult = sqlite.prepare(
          `INSERT INTO photos (filename, size, uploader_id, created_at) VALUES (?, ?, ?, ?)`
        ).run(fileInfo.filename, fileInfo.size, memberId, dateformat(Number(path.parse(fileInfo.filename).name), 'yyyy-mm-dd HH:MM:ss'));

        const photoId = photoResult.lastInsertRowid;

        for (const tag of JSON.parse(fields.tags)) {
          sqlite.prepare(`INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING`).run(tag.text);
          const tagRow = sqlite.prepare(`SELECT id FROM tags WHERE name = ?`).get(tag.text);
          sqlite.prepare(`INSERT INTO photo_tags (photo_id, tag_id) VALUES (?, ?)`).run(photoId, tagRow.id);
        }
      });

      uploadTx();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진 업로드', request.method, 200, fields, null));
      return reply.code(200).send(success(null));
    }
    catch(e) {
      if (savedFilePath) try { fs.unlinkSync(savedFilePath); } catch(_) {}
      if (savedThumbPath) try { fs.unlinkSync(savedThumbPath); } catch(_) {}
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 사진 업로드 오류', request.method, 500, null, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // DELETE /api/gallery/photos/:photoId
  fastify.delete('/photos/:photoId', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      const photo = db.select().from(photos).where(eq(photos.filename, request.params.photoId)).get();
      if (!photo) return reply.code(404).send(error('ERR_NOT_FOUND', '사진을 찾을 수 없습니다.'));

      const memberId = util.resolveMemberId(request.decoded);
      const isOwner = photo.uploaderId === memberId;

      if (isOwner) {
        const deleteTx = sqlite.transaction(() => {
          sqlite.prepare(`DELETE FROM photo_tags WHERE photo_id = ?`).run(photo.id);
          sqlite.prepare(`DELETE FROM photo_likes WHERE photo_id = ?`).run(photo.id);
          sqlite.prepare(`DELETE FROM photos WHERE id = ?`).run(photo.id);
        });

        deleteTx();

        await fs.promises.unlink(path.join(galleryDir, request.params.photoId));
        await fs.promises.unlink(path.join(galleryDir, 'thumb_' + request.params.photoId));

        util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진 삭제', request.method, 200, request.params, null));
        return reply.code(200).send(success(null));
      }
      else {
        util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 사진 삭제 오류', request.method, 403, request.params, 'ERR_PHOTO_NOT_MINE'));
        return reply.code(403).send(error('ERR_PHOTO_NOT_MINE', '내 사진이 아닙니다.'));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 사진 삭제 오류', request.method, 500, request.params, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // POST /api/gallery/photos/:photoId/likes
  fastify.post('/photos/:photoId/likes', { preHandler: [util.optionalAuth] }, async (request, reply) => {
    try {
      const userID = util.resolveMemberId(request.decoded);

      const photo = db.select().from(photos).where(eq(photos.filename, request.params.photoId)).get();
      if (!photo) return reply.code(404).send(error('ERR_NOT_FOUND', '사진을 찾을 수 없습니다.'));

      // Check if already liked within 30 days
      const previous = sqlite.prepare(
        `SELECT * FROM photo_likes WHERE photo_id = ? AND ip = ? AND created_at > datetime('now', '-30 days')`
      ).all(photo.id, request.remoteIP);

      if(previous.length) {
        return reply.code(400).send(error('ERR_ALREADY_BEEN_LIKED', '이미 좋아요한 사진입니다.'));
      }

      const likeTx = sqlite.transaction(() => {
        sqlite.prepare(`INSERT INTO photo_likes (photo_id, ip, user_id) VALUES (?, ?, ?)`).run(photo.id, request.remoteIP, userID);
        sqlite.prepare(`UPDATE photos SET likes_count = likes_count + 1 WHERE id = ?`).run(photo.id);
      });

      likeTx();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 좋아요 요청', request.method, 200, request.params, null));
      return reply.code(200).send(success(null));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 좋아요 요청 오류', request.method, 500, request.params, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });

  // GET /api/gallery/ranking
  fastify.get('/ranking', async (request, reply) => {
    try {
      let lastMonthFirst = new Date();
      lastMonthFirst.setDate(0);
      lastMonthFirst.setDate(1);
      lastMonthFirst.setHours(0,0,0,0);

      let monthFirst = new Date();
      monthFirst.setDate(1);
      monthFirst.setHours(0,0,0,0);

      let weekFirst = new Date(Date.now() - 7 * 24 * 3600000);

      const likeList = sqlite.prepare(
        `SELECT created_at as timestamp, photo_id FROM photo_likes WHERE created_at >= ?`
      ).all(dateformat(lastMonthFirst, 'yyyy-mm-dd'));

      let weekRank = [], monthRank = [], lastMonthRank = [];
      for(const like of likeList.reverse()) {
        const likeDate = new Date(like.timestamp);
        const photoId = like.photo_id;

        if(likeDate < monthFirst) {
          const flag = lastMonthRank.find(x => x.photoId == photoId);
          if(flag) flag.count++;
          else lastMonthRank.push({ photoId, count: 1 });
        }
        else {
          const flag = monthRank.find(x => x.photoId == photoId);
          if(flag) flag.count++;
          else monthRank.push({ photoId, count: 1 });
        }

        if(likeDate > weekFirst) {
          const flag = weekRank.find(x => x.photoId == photoId);
          if(flag) flag.count++;
          else weekRank.push({ photoId, count: 1 });
        }
      }
      weekRank = weekRank.sort((a, b) => b.count - a.count).slice(0, 3);
      monthRank = monthRank.sort((a, b) => b.count - a.count).slice(0, 3);
      lastMonthRank = lastMonthRank.sort((a, b) => b.count - a.count).slice(0, 3);

      function enrichRank(rankList) {
        for (let item of rankList) {
          const photo = db.select().from(photos).where(eq(photos.id, item.photoId)).get();
          if (photo) {
            item.photoId = photo.filename;
            const uploader = db.select({ name: members.name }).from(members).where(eq(members.id, photo.uploaderId)).get();
            item.uploader = uploader ? uploader.name : '';
            const tagRows = db.select({ name: tags.name })
              .from(photoTags)
              .innerJoin(tags, eq(photoTags.tagId, tags.id))
              .where(eq(photoTags.photoId, photo.id))
              .all();
            item.tag = tagRows.map(t => t.name);
          }
        }
      }

      enrichRank(weekRank);
      enrichRank(monthRank);
      enrichRank(lastMonthRank);

      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 랭킹 요청', request.method, 200, null, null));
      return reply.code(200).send(success({ week: weekRank, month: monthRank, lastMonth: lastMonthRank }));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 랭킹 요청 오류', request.method, 500, null, e.stack));
      return reply.code(500).send(error('ERR_UNKNOWN', '알 수 없는 오류입니다.'));
    }
  });
}
