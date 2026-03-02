import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import sharp from 'sharp';
import jwt from 'jsonwebtoken';
import dateformat from 'dateformat';
import { eq, and, desc, asc, sql, gte, count } from 'drizzle-orm';

import { db, sqlite } from '../db/index.js';
import { members, photos, tags, photoTags, photoLikes } from '../db/schema.js';
import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';

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
    photo_id: photoRow.filename,
    size: photoRow.size,
    uploader_id: photoRow.uploaderId,
    uploader_name: uploader ? uploader.name : '',
    timestamp: photoRow.createdAt,
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

  fastify.get('/tags', async (request, reply) => {
    try {
      const result = db.select({
        tag_name: tags.name,
        photo_count: count(photoTags.photoId),
        likes: sql`COALESCE(SUM(${photos.likesCount}), 0)`.as('likes'),
      })
        .from(tags)
        .leftJoin(photoTags, eq(photoTags.tagId, tags.id))
        .leftJoin(photos, eq(photoTags.photoId, photos.id))
        .groupBy(tags.id)
        .all();

      // Add newest_photo_id for each tag
      for (const tag of result) {
        const newest = db.select({ filename: photos.filename })
          .from(photoTags)
          .innerJoin(tags, eq(photoTags.tagId, tags.id))
          .innerJoin(photos, eq(photoTags.photoId, photos.id))
          .where(eq(tags.name, tag.tag_name))
          .orderBy(desc(photos.id))
          .limit(1)
          .get();
        tag.newest_photo_id = newest ? newest.filename : null;
      }

      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 태그 목록 요청', request.method, 200, request.query, result));
      return reply.code(200).send(result);
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 태그 목록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send();
    }
  });

  fastify.get('/image', async (request, reply) => {
    try {
      const photo = db.select().from(photos).where(eq(photos.filename, request.query.photo_id)).get();
      if (!photo) return reply.code(404).send();
      const result = getPhotoWithDetails(photo);

      util.logger(new Log('info', request.remoteIP, request.originalPath, '사진 세부정보 요청', request.method, 200, request.query, result));
      return reply.code(200).send(result);
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '사진 세부정보 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send();
    }
  });

  fastify.get('/photographer', async (request, reply) => {
    const orderCol = request.query.sort === 'popular' ? desc(photos.likesCount) : desc(photos.id);
    try {
      const photoRows = db.select().from(photos)
        .where(eq(photos.uploaderId, Number(request.query.uid)))
        .orderBy(orderCol)
        .limit(10)
        .offset(Number(request.query.offset))
        .all();

      const result = getPhotosListWithDetails(photoRows);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진작가 사진 목록 요청', request.method, 200, request.query, result));
      return reply.code(200).send(result);
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 사진작가 사진 목록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send();
    }
  });

  fastify.get('/cat', async (request, reply) => {
    try {
      const tag = db.select().from(tags).where(eq(tags.name, request.query.cid)).get();
      if (!tag) return reply.code(200).send([]);

      const photoIds = db.select({ photoId: photoTags.photoId })
        .from(photoTags)
        .where(eq(photoTags.tagId, tag.id))
        .orderBy(desc(photoTags.photoId))
        .limit(10)
        .offset(Number(request.query.offset))
        .all();

      const result = [];
      for (const { photoId } of photoIds) {
        const photo = db.select().from(photos).where(eq(photos.id, photoId)).get();
        if (photo) result.push(getPhotoWithDetails(photo));
      }

      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 태그 사진 목록 요청', request.method, 200, request.query, result));
      return reply.code(200).send(result);
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 태그 사진 목록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send();
    }
  });

  fastify.get('/photo', async (request, reply) => {
    const orderCol = request.query.sort === 'popular' ? desc(photos.likesCount) : desc(photos.id);

    try {
      if(request.query.type == 'gallery') {
        const photoRows = db.select().from(photos)
          .orderBy(orderCol)
          .limit(10)
          .offset(Number(request.query.offset))
          .all();

        const result = getPhotosListWithDetails(photoRows);
        util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진 목록 요청', request.method, 200, request.query, result));
        return reply.code(200).send(result);
      }
      else if(request.query.type == 'uploader') {
        // Aggregate uploaders from photos
        const orderClause = request.query.sort === 'popular'
          ? sql`SUM(${photos.likesCount}) DESC, ${members.name} ASC`
          : sql`MAX(${photos.id}) DESC, ${members.name} ASC`;

        const result = sqlite.prepare(`
          SELECT
            p.uploader_id,
            m.name AS uploader_name,
            COUNT(*) AS photo_count,
            SUM(p.likes_count) AS likes,
            (SELECT p2.filename FROM photos p2 WHERE p2.uploader_id = p.uploader_id ORDER BY p2.id DESC LIMIT 1) AS newest_photo_id
          FROM photos p
          INNER JOIN members m ON p.uploader_id = m.id
          GROUP BY p.uploader_id
          HAVING photo_count > 0
          ORDER BY ${request.query.sort === 'popular' ? 'likes DESC,' : 'newest_photo_id DESC,'} uploader_name ASC
          LIMIT 10 OFFSET ?
        `).all(Number(request.query.offset));

        util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진작가 목록 요청', request.method, 200, request.query, result));
        return reply.code(200).send(result);
      }
      else if(request.query.type == 'cat') {
        // Aggregate tags from photo_tags
        const result = sqlite.prepare(`
          SELECT
            t.name AS tag_name,
            COUNT(pt.photo_id) AS photo_count,
            COALESCE(SUM(p.likes_count), 0) AS likes,
            (SELECT p2.filename FROM photo_tags pt2 INNER JOIN photos p2 ON pt2.photo_id = p2.id WHERE pt2.tag_id = t.id ORDER BY p2.id DESC LIMIT 1) AS newest_photo_id
          FROM tags t
          INNER JOIN photo_tags pt ON pt.tag_id = t.id
          INNER JOIN photos p ON pt.photo_id = p.id
          GROUP BY t.id
          HAVING photo_count > 0
          ORDER BY ${request.query.sort === 'popular' ? 'likes DESC,' : 'newest_photo_id DESC,'} tag_name ASC
          LIMIT 10 OFFSET ?
        `).all(Number(request.query.offset));

        util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 태그 목록 요청', request.method, 200, request.query, result));
        return reply.code(200).send(result);
      }
      else return reply.code(404).send('fail');
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 목록 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send();
    }
  });

  fastify.post('/photo', { preHandler: [util.isLogin] }, async (request, reply) => {
    let savedFilePath = null;
    let savedThumbPath = null;
    try {
      // Parse multipart: collect file and fields
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

      // Generate thumbnail
      const thumbPath = path.join(fileInfo.destination, 'thumb_' + fileInfo.filename);
      await sharp(fileInfo.path).resize(1000).withMetadata().toFile(thumbPath);
      savedThumbPath = thumbPath;

      // Resolve uploader memberId
      let memberId = request.decoded.memberId;
      if (!memberId) {
        const member = util.getMemberByStudentId(request.decoded.id);
        memberId = member ? member.id : null;
      }

      const uploadTx = sqlite.transaction(() => {
        // Insert photo
        const photoResult = sqlite.prepare(
          `INSERT INTO photos (filename, size, uploader_id, created_at) VALUES (?, ?, ?, ?)`
        ).run(fileInfo.filename, fileInfo.size, memberId, dateformat(Number(path.parse(fileInfo.filename).name), 'yyyy-mm-dd HH:MM:ss'));

        const photoId = photoResult.lastInsertRowid;

        // Process tags
        for (const tag of JSON.parse(fields.tags)) {
          // Upsert tag
          sqlite.prepare(`INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING`).run(tag.text);
          const tagRow = sqlite.prepare(`SELECT id FROM tags WHERE name = ?`).get(tag.text);
          // Insert photo_tag
          sqlite.prepare(`INSERT INTO photo_tags (photo_id, tag_id) VALUES (?, ?)`).run(photoId, tagRow.id);
        }
      });

      uploadTx();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진 업로드', request.method, 200, fields, null));
      return reply.code(200).send();
    }
    catch(e) {
      // Cleanup uploaded files on error
      if (savedFilePath) try { fs.unlinkSync(savedFilePath); } catch(_) {}
      if (savedThumbPath) try { fs.unlinkSync(savedThumbPath); } catch(_) {}
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 사진 업로드 오류', request.method, 500, null, e.stack));
      return reply.code(500).send();
    }
  });

  fastify.delete('/photo', { preHandler: [util.isLogin] }, async (request, reply) => {
    try {
      const photo = db.select().from(photos).where(eq(photos.filename, request.body.pid)).get();
      if (!photo) return reply.code(404).send();

      // Check ownership: support both memberId (new token) and studentId (old token)
      let isOwner = false;
      if (request.decoded.memberId) {
        isOwner = photo.uploaderId === request.decoded.memberId;
      } else {
        const member = util.getMemberByStudentId(request.decoded.id);
        isOwner = member && photo.uploaderId === member.id;
      }

      if (isOwner) {
        const deleteTx = sqlite.transaction(() => {
          sqlite.prepare(`DELETE FROM photo_tags WHERE photo_id = ?`).run(photo.id);
          sqlite.prepare(`DELETE FROM photo_likes WHERE photo_id = ?`).run(photo.id);
          sqlite.prepare(`DELETE FROM photos WHERE id = ?`).run(photo.id);
        });

        deleteTx();

        await fs.promises.unlink(path.join(galleryDir, request.body.pid));
        await fs.promises.unlink(path.join(galleryDir, 'thumb_' + request.body.pid));

        util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진 삭제', request.method, 200, request.body, null));
        return reply.code(200).send();
      }
      else {
        util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 사진 삭제 오류', request.method, 403, request.body, 'ERR_PHOTO_NOT_MINE'));
        return reply.code(403).send(new Response('error', '내 사진이 아닙니다.', 'ERR_PHOTO_NOT_MINE'));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 사진 삭제 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  fastify.post('/like', async (request, reply) => {
    try {
      const token = request.headers['x-access-token'];
      let userID = null;

      if(token) {
        try {
          const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
              if (err) reject(err);
              else resolve(decoded);
            });
          });
          userID = decoded.memberId || null;
          if (!userID && decoded.id) {
            const member = util.getMemberByStudentId(decoded.id);
            userID = member ? member.id : null;
          }
        } catch(_) {}
      }

      const photo = db.select().from(photos).where(eq(photos.filename, request.body.photo_id)).get();
      if (!photo) return reply.code(404).send();

      // Check if already liked within 30 days
      const previous = sqlite.prepare(
        `SELECT * FROM photo_likes WHERE photo_id = ? AND ip = ? AND created_at > datetime('now', '-30 days')`
      ).all(photo.id, request.remoteIP);

      if(previous.length) {
        return reply.code(400).send(new Response('error', '이미 좋아요한 사진입니다.', 'ERR_ALREADY_BEEN_LIKED'));
      }

      const likeTx = sqlite.transaction(() => {
        sqlite.prepare(`INSERT INTO photo_likes (photo_id, ip, user_id) VALUES (?, ?, ?)`).run(photo.id, request.remoteIP, userID);
        sqlite.prepare(`UPDATE photos SET likes_count = likes_count + 1 WHERE id = ?`).run(photo.id);
      });

      likeTx();

      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 좋아요 요청', request.method, 200, request.body, null));
      return reply.code(200).send();
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 좋아요 요청 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send();
    }
  });

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
          const flag = lastMonthRank.find(x => x.photo_id == photoId);
          if(flag) flag.count++;
          else lastMonthRank.push({ photo_id: photoId, count: 1 });
        }
        else {
          const flag = monthRank.find(x => x.photo_id == photoId);
          if(flag) flag.count++;
          else monthRank.push({ photo_id: photoId, count: 1 });
        }

        if(likeDate > weekFirst) {
          const flag = weekRank.find(x => x.photo_id == photoId);
          if(flag) flag.count++;
          else weekRank.push({ photo_id: photoId, count: 1 });
        }
      }
      weekRank = weekRank.sort((a, b) => b.count - a.count).slice(0, 3);
      monthRank = monthRank.sort((a, b) => b.count - a.count).slice(0, 3);
      lastMonthRank = lastMonthRank.sort((a, b) => b.count - a.count).slice(0, 3);

      // Enrich ranking data with photo info
      function enrichRank(rankList) {
        for (let item of rankList) {
          const photo = db.select().from(photos).where(eq(photos.id, item.photo_id)).get();
          if (photo) {
            item.photo_id = photo.filename;
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
      return reply.code(200).send({ week: weekRank, month: monthRank, lastmonth: lastMonthRank });
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 랭킹 요청 오류', request.method, 500, null, e.stack));
      return reply.code(500).send();
    }
  });
}
