import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import sharp from 'sharp';
import jwt from 'jsonwebtoken';
import dateformat from 'dateformat';

import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';
import pool from '../config/mariadb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const galleryDir = path.join(__dirname, '../web/res/image/gallery');

export default async function(fastify, opts) {
  // Register multipart only in this plugin scope (avoids conflict with formbody)
  await fastify.register(import('@fastify/multipart'), { limits: { fileSize: 50 * 1024 * 1024 } });

  fastify.get('/tags', async (request, reply) => {
    try {
      const result = await util.query(`SELECT * FROM gallery_tag;`);
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
      const result = await util.query(`SELECT * FROM gallery_photo WHERE photo_id='${request.query.photo_id}';`);
      const tags = await util.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${request.query.photo_id}';`);
      result[0].tags = tags.map(x => x.tag_name);

      util.logger(new Log('info', request.remoteIP, request.originalPath, '사진 세부정보 요청', request.method, 200, request.query, result[0]));
      return reply.code(200).send(result[0]);
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '사진 세부정보 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send();
    }
  });

  fastify.get('/photographer', async (request, reply) => {
    const row = { latest: 'photo_id', popular: 'likes' };
    try {
      const result = await util.query(`SELECT * FROM gallery_photo WHERE uploader_id=${request.query.uid} ORDER BY ${row[request.query.sort]} DESC LIMIT 10 OFFSET ${request.query.offset};`);
      for(const i in result) {
        const tags = await util.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${result[i].photo_id}';`);
        result[i].tags = tags.map(x => x.tag_name);
      }
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
      let result = [];
      const tagResult = await util.query(`SELECT * FROM gallery_photo_tag WHERE tag_name='${request.query.cid}' ORDER BY photo_id DESC LIMIT 10 OFFSET ${request.query.offset};`);
      for(const photo of tagResult) {
        const detail = await util.query(`SELECT * FROM gallery_photo WHERE photo_id='${photo.photo_id}'`);
        const tags = await util.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${photo.photo_id}';`);
        detail[0].tags = tags.map(x => x.tag_name);
        result.push(detail[0]);
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
    const row = { latest: 'photo_id', popular: 'likes' };

    try {
      if(request.query.type == 'gallery') {
        const result = await util.query(`SELECT * FROM gallery_photo ORDER BY ${row[request.query.sort]} DESC LIMIT 10 OFFSET ${request.query.offset};`);
        for(const i in result) {
          const tags = await util.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${result[i].photo_id}';`);
          result[i].tags = tags.map(x => x.tag_name);
        }

        util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진 목록 요청', request.method, 200, request.query, result));
        return reply.code(200).send(result);
      }
      else if(request.query.type == 'uploader') {
        const result = await util.query(`SELECT * FROM gallery_uploader WHERE photo_count > 0 ORDER BY ${row[request.query.sort] ? `${row[request.query.sort]} DESC,` : '' } uploader_name ASC LIMIT 10 OFFSET ${request.query.offset};`);

        util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진작가 목록 요청', request.method, 200, request.query, result));
        return reply.code(200).send(result);
      }
      else if(request.query.type == 'cat') {
        const result = await util.query(`SELECT * FROM gallery_tag WHERE photo_count > 0 ORDER BY ${row[request.query.sort] ? `${row[request.query.sort]} DESC,` : '' } tag_name ASC LIMIT 10 OFFSET ${request.query.offset};`);

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
    const conn = await pool.getConnection();
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

      await conn.beginTransaction();

      let uploader_name = await conn.query(`SELECT name FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE ID=${request.decoded.id};`);
      uploader_name = uploader_name[0].name;
      await conn.query(`INSERT INTO gallery_photo(photo_id, size, uploader_id, uploader_name, timestamp) VALUES('${fileInfo.filename}', ${fileInfo.size}, ${request.decoded.id}, '${uploader_name}', '${dateformat(Number(path.parse(fileInfo.filename).name), 'yyyy-mm-dd HH:MM:ss')}');`);

      // tag analysis
      for(const tag of JSON.parse(fields.tags)) {
        await conn.query(`INSERT INTO gallery_tag(tag_name, photo_count, newest_photo_id) VALUES('${tag.text}', 1, '${fileInfo.filename}') ON DUPLICATE KEY UPDATE photo_count=photo_count+1, newest_photo_id='${fileInfo.filename}';`);
        await conn.query(`INSERT INTO gallery_photo_tag(photo_id, tag_name) VALUES('${fileInfo.filename}', '${tag.text}');`);
      }
      // gallery_uploader update
      await conn.query(`INSERT INTO gallery_uploader(uploader_id, uploader_name, photo_count, newest_photo_id) VALUES(${request.decoded.id}, '${uploader_name}', 1, '${fileInfo.filename}') ON DUPLICATE KEY UPDATE photo_count=photo_count+1, newest_photo_id='${fileInfo.filename}';`);

      await conn.commit();
      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진 업로드', request.method, 200, fields, null));
      return reply.code(200).send();
    }
    catch(e) {
      await conn.rollback();
      // Cleanup uploaded files on error
      if (savedFilePath) try { await fs.promises.unlink(savedFilePath); } catch(_) {}
      if (savedThumbPath) try { await fs.promises.unlink(savedThumbPath); } catch(_) {}
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 사진 업로드 오류', request.method, 500, null, e.stack));
      return reply.code(500).send();
    }
    finally { conn.release(); }
  });

  fastify.delete('/photo', { preHandler: [util.isLogin] }, async (request, reply) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const photo = await conn.query(`SELECT * FROM gallery_photo WHERE photo_id='${request.body.pid}';`);
      if(photo[0].uploader_id == request.decoded.id) {
        const tags = await conn.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${request.body.pid}';`);

        await conn.query(`DELETE FROM gallery_photo WHERE photo_id='${request.body.pid}';`);
        await conn.query(`DELETE FROM gallery_photo_tag WHERE photo_id='${request.body.pid}';`);
        for(const tag of tags) await conn.query(`UPDATE gallery_tag SET photo_count=photo_count-1, likes=likes-${photo[0].likes} WHERE tag_name='${tag.tag_name}';`);
        await conn.query(`UPDATE gallery_uploader SET photo_count=photo_count-1, likes=likes-${photo[0].likes} WHERE uploader_id='${request.decoded.id}';`);

        await fs.promises.unlink(path.join(galleryDir, request.body.pid));
        await fs.promises.unlink(path.join(galleryDir, 'thumb_' + request.body.pid));

        await conn.commit();
        util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 사진 삭제', request.method, 200, request.body, null));
        return reply.code(200).send();
      }
      else {
        util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 사진 삭제 오류', request.method, 403, request.body, 'ERR_PHOTO_NOT_MINE'));
        return reply.code(403).send(new Response('error', '내 사진이 아닙니다.', 'ERR_PHOTO_NOT_MINE'));
      }
    }
    catch(e) {
      await conn.rollback();
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 사진 삭제 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
    finally { conn.release(); }
  });

  fastify.post('/like', async (request, reply) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

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
          userID = decoded.id;
        } catch(_) {}
      }

      // check if already liked target photo
      const previous = await conn.query(`SELECT * FROM gallery_like WHERE photo_id='${request.body.photo_id}' AND ip='${request.remoteIP}' AND timestamp > now() - interval 30 DAY;`);
      if(previous.length) throw new Error('ALREADY_BEEN_LIKED');
      else await conn.query(`INSERT INTO gallery_like(ip, photo_id, user_id) VALUES('${request.remoteIP}', '${request.body.photo_id}', ${userID});`);

      const uploader = await conn.query(`SELECT uploader_id FROM gallery_photo WHERE photo_id='${request.body.photo_id}';`);
      const tags = await conn.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${request.body.photo_id}';`);
      await conn.query(`UPDATE gallery_photo SET likes=likes+1 WHERE photo_id='${request.body.photo_id}';`);
      for (const tag of tags) {
        await conn.query(`UPDATE gallery_tag SET likes=likes+1 WHERE tag_name='${tag.tag_name}';`);
      }
      await conn.query(`UPDATE gallery_uploader SET likes=likes+1 WHERE uploader_id=${uploader[0].uploader_id};`);

      await conn.commit();
      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 좋아요 요청', request.method, 200, request.body, null));
      return reply.code(200).send();
    }
    catch(e) {
      await conn.rollback();
      if(e.message == 'ALREADY_BEEN_LIKED') return reply.code(400).send(new Response('error', '이미 좋아요한 사진입니다.', 'ERR_ALREADY_BEEN_LIKED'));
      else {
        util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 좋아요 요청 오류', request.method, 500, request.body, e.stack));
        return reply.code(500).send();
      }
    }
    finally { conn.release(); }
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

      const likeList = await util.query(`SELECT timestamp, photo_id FROM gallery_like WHERE timestamp >= '${dateformat(lastMonthFirst, 'yyyy-mm-dd')}';`);

      let weekRank = [], monthRank = [], lastMonthRank = [];
      for(const like of likeList.reverse()) {
        if(like.timestamp < monthFirst) {
          const flag = lastMonthRank.find(x => x.photo_id == like.photo_id);
          if(flag) flag.count++;
          else lastMonthRank.push({ photo_id: like.photo_id, count: 1 });
        }
        else {
          const flag = monthRank.find(x => x.photo_id == like.photo_id);
          if(flag) flag.count++;
          else monthRank.push({ photo_id: like.photo_id, count: 1 });
        }

        if(like.timestamp > weekFirst) {
          const flag = weekRank.find(x => x.photo_id == like.photo_id);
          if(flag) flag.count++;
          else weekRank.push({ photo_id: like.photo_id, count: 1 });
        }
      }
      weekRank = weekRank.sort((a, b) => b.count - a.count).slice(0, 3);
      monthRank = monthRank.sort((a, b) => b.count - a.count).slice(0, 3);
      lastMonthRank = lastMonthRank.sort((a, b) => b.count - a.count).slice(0, 3);

      for(let i in weekRank) {
        const info = await util.query(`SELECT uploader_name FROM gallery_photo WHERE photo_id='${weekRank[i].photo_id}';`);
        const tags = await util.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${weekRank[i].photo_id}';`);
        weekRank[i].uploader = info[0].uploader_name;
        weekRank[i].tag = tags.map(x => x.tag_name);
      }
      for(let i in monthRank) {
        const info = await util.query(`SELECT uploader_name FROM gallery_photo WHERE photo_id='${monthRank[i].photo_id}';`);
        const tags = await util.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${monthRank[i].photo_id}';`);
        monthRank[i].uploader = info[0].uploader_name;
        monthRank[i].tag = tags.map(x => x.tag_name);
      }
      for(let i in lastMonthRank) {
        const info = await util.query(`SELECT uploader_name FROM gallery_photo WHERE photo_id='${lastMonthRank[i].photo_id}';`);
        const tags = await util.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${lastMonthRank[i].photo_id}';`);
        lastMonthRank[i].uploader = info[0].uploader_name;
        lastMonthRank[i].tag = tags.map(x => x.tag_name);
      }
      util.logger(new Log('info', request.remoteIP, request.originalPath, '갤러리 랭킹 요청', request.method, 200, null, null));
      return reply.code(200).send({ week: weekRank, month: monthRank, lastmonth: lastMonthRank });
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '갤러리 랭킹 요청 오류', request.method, 500, null, e.stack));
      return reply.code(500).send();
    }
  });
}
