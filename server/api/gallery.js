import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import multer from 'multer';
import express from 'express';
import dateformat from 'dateformat';
import bodyParser from 'body-parser';

import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';
import pool from '../config/mariadb';

let router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

let upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, __dirname + '/../../res/image/gallery'),
    filename: (req, file, cb) => cb(null, new Date().getTime() + path.extname(file.originalname))
  })
});

router.get('/tags', async (req, res) => {
  try {
    const result = await util.query(`SELECT * FROM gallery_tag;`);
    util.logger(new Log('info', req.remoteIP, req.originalPath, '갤러리 태그 목록 요청', req.method, 200, req.query, result));
    res.status(200).send(result);
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '갤러리 태그 목록 요청 오류', req.method, 500, req.query, e.stack));
    res.status(500).send();
  }
});

router.get('/image', async (req, res) => {
  try {
    const result = await util.query(`SELECT * FROM gallery_photo WHERE photo_id='${req.query.photo_id}';`);
    const tags = await util.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${req.query.photo_id}';`);
    result[0].tags = tags.map(x => x.tag_name);
    
    util.logger(new Log('info', req.remoteIP, req.originalPath, '사진 세부정보 요청', req.method, 200, req.query, result[0]));
    res.status(200).send(result[0]);
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '사진 세부정보 요청 오류', req.method, 500, req.query, e.stack));
    res.status(500).send();
  }
});

router.get('/photographer', async (req, res) => {
  const row = { latest: 'photo_id', popular: 'likes' };
  try {
    const result = await util.query(`SELECT * FROM gallery_photo WHERE uploader_id=${req.query.uid} ORDER BY ${row[req.query.sort]} DESC LIMIT 10 OFFSET ${req.query.offset};`);
    for(const i in result) {
      const tags = await util.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${result[i].photo_id}';`);
      result[i].tags = tags.map(x => x.tag_name);
    }
    util.logger(new Log('info', req.remoteIP, req.originalPath, '갤러리 사진작가 사진 목록 요청', req.method, 200, req.query, result));
    res.status(200).send(result);
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '갤러리 사진작가 사진 목록 요청 오류', req.method, 500, req.query, e.stack));
    res.status(500).send();
  }
});

router.get('/cat', async (req, res) => {
  const row = { latest: 'photo_id', popular: 'likes' };
  try {
    let result = [];
    const tagResult = await util.query(`SELECT * FROM gallery_photo_tag WHERE tag_name='${req.query.cid}' ORDER BY photo_id DESC LIMIT 10 OFFSET ${req.query.offset};`);
    for(const photo of tagResult) {
      const detail = await util.query(`SELECT * FROM gallery_photo WHERE photo_id='${photo.photo_id}'`);
      const tags = await util.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${photo.photo_id}';`);
      detail[0].tags = tags.map(x => x.tag_name);
      result.push(detail[0]);
    }
    util.logger(new Log('info', req.remoteIP, req.originalPath, '갤러리 태그 사진 목록 요청', req.method, 200, req.query, result));
    res.status(200).send(result);
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '갤러리 태그 사진 목록 요청 오류', req.method, 500, req.query, e.stack));
    res.status(500).send();
  }
});

router.get('/photo', async (req, res) => {
  const row = { latest: 'photo_id', popular: 'likes' };
  
  try {
    if(req.query.type == 'gallery') {
      const result = await util.query(`SELECT * FROM gallery_photo ORDER BY ${row[req.query.sort]} DESC LIMIT 10 OFFSET ${req.query.offset};`);
      for(const i in result) {
        const tags = await util.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${result[i].photo_id}';`);
        result[i].tags = tags.map(x => x.tag_name);
      }

      util.logger(new Log('info', req.remoteIP, req.originalPath, '갤러리 사진 목록 요청', req.method, 200, req.query, result));
      res.status(200).send(result);
    }
    else if(req.query.type == 'uploader') {
      const result = await util.query(`SELECT * FROM gallery_uploader WHERE photo_count > 0 ORDER BY ${row[req.query.sort] ? `${row[req.query.sort]} DESC,` : '' } uploader_name ASC LIMIT 10 OFFSET ${req.query.offset};`);

      util.logger(new Log('info', req.remoteIP, req.originalPath, '갤러리 사진작가 목록 요청', req.method, 200, req.query, result));
      res.status(200).send(result);
    }
    else if(req.query.type == 'cat') {
      const result = await util.query(`SELECT * FROM gallery_tag WHERE photo_count > 0 ORDER BY ${row[req.query.sort] ? `${row[req.query.sort]} DESC,` : '' } tag_name ASC LIMIT 10 OFFSET ${req.query.offset};`);

      util.logger(new Log('info', req.remoteIP, req.originalPath, '갤러리 태그 목록 요청', req.method, 200, req.query, result));
      res.status(200).send(result);
    }
    else res.status(404).send('fail');
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '갤러리 목록 요청 오류', req.method, 500, req.query, e.stack));
    res.status(500).send();
  }
});

router.post('/photo', util.isLogin, upload.any(), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await sharp(req.files[0].path).resize(1000).toFile(req.files[0].destination + '/thumb_' + req.files[0].filename);
    
    await conn.beginTransaction();
    
    // 업로더 이름 확인 및 gallery_photo 업데이트
    let uploader_name = await conn.query(`SELECT name FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE ID=${req.decoded.id};`);
    uploader_name = uploader_name[0].name;
    await conn.query(`INSERT INTO gallery_photo(photo_id, size, uploader_id, uploader_name, timestamp) VALUES('${req.files[0].filename}', ${req.files[0].size}, ${req.decoded.id}, '${uploader_name}', '${dateformat(Number(path.parse(req.files[0].filename).name), 'yyyy-mm-dd HH:MM:ss')}');`);
    
    // tag 분석
    for(const tag of JSON.parse(req.body.tags)) {
      // gallery_tag 업데이트
      await conn.query(`INSERT INTO gallery_tag(tag_name, photo_count, newest_photo_id) VALUES('${tag.text}', 1, '${req.files[0].filename}') ON DUPLICATE KEY UPDATE photo_count=photo_count+1, newest_photo_id='${req.files[0].filename}';`);
      // gallery_photo_tag 업데이트
      await conn.query(`INSERT INTO gallery_photo_tag(photo_id, tag_name) VALUES('${req.files[0].filename}', '${tag.text}');`);
    }
    // gallery_uploader 업데이트
    await conn.query(`INSERT INTO gallery_uploader(uploader_id, uploader_name, photo_count, newest_photo_id) VALUES(${req.decoded.id}, '${uploader_name}', 1, '${req.files[0].filename}') ON DUPLICATE KEY UPDATE photo_count=photo_count+1, newest_photo_id='${req.files[0].filename}';`);
    
    await conn.commit();
    util.logger(new Log('info', req.remoteIP, req.originalPath, '갤러리 사진 업로드', req.method, 200, req.body, null));
    res.status(200).send();
  }
  catch(e) {
    await conn.rollback();
    util.logger(new Log('error', req.remoteIP, req.originalPath, '갤러리 사진 업로드 오류', req.method, 500, req.body, e.stack));
    res.status(500).send();
  }
  finally { conn.release(); }
});

router.delete('/photo', util.isLogin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    const photo = await conn.query(`SELECT * FROM gallery_photo WHERE photo_id='${req.body.pid}';`);
    if(photo[0].uploader_id == req.decoded.id) {
      const tags = await conn.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${req.body.pid}';`);
      
      await conn.query(`DELETE FROM gallery_photo WHERE photo_id='${req.body.pid}';`);
      await conn.query(`DELETE FROM gallery_photo_tag WHERE photo_id='${req.body.pid}';`);
      for(const tag of tags) await conn.query(`UPDATE gallery_tag SET photo_count=photo_count-1, likes=likes-${photo[0].likes} WHERE tag_name='${tag.tag_name}';`);
      await conn.query(`UPDATE gallery_uploader SET photo_count=photo_count-1, likes=likes-${photo[0].likes} WHERE uploader_id='${req.decoded.id}';`);
      
      await fs.promises.unlink(__dirname + '/../../res/image/gallery/' + req.body.pid);
      await fs.promises.unlink(__dirname + '/../../res/image/gallery/thumb_' + req.body.pid);
      
      await conn.commit();
      util.logger(new Log('info', req.remoteIP, req.originalPath, '갤러리 사진 삭제', req.method, 204, req.body, null));
      res.status(204).send();
    }
    else {
      util.logger(new Log('error', req.remoteIP, req.originalPath, '갤러리 사진 삭제 오류', req.method, 403, req.body, 'ERR_PHOTO_NOT_MINE'));
      res.status(403).json(new Response('error', '내 사진이 아닙니다.', 'ERR_PHOTO_NOT_MINE'));
    }
  }
  catch(e) {
    await conn.rollback();
    util.logger(new Log('error', req.remoteIP, req.originalPath, '갤러리 사진 삭제 오류', req.method, 500, req.body, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
  finally { conn.release(); }
});

router.post('/like', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    const uploader = await conn.query(`SELECT uploader_id FROM gallery_photo WHERE photo_id='${req.body.photo_id}';`);
    const tags = await conn.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${req.body.photo_id}';`);
    await conn.query(`UPDATE gallery_photo SET likes=likes+1 WHERE photo_id='${req.body.photo_id}';`);
    tags.forEach(async tag => await conn.query(`UPDATE gallery_tag SET likes=likes+1 WHERE tag_name='${tag.tag_name}';`));
    await conn.query(`UPDATE gallery_uploader SET likes=likes+1 WHERE uploader_id=${uploader[0].uploader_id};`);
    
    await conn.commit();
    util.logger(new Log('info', req.remoteIP, req.originalPath, '갤러리 좋아요 요청', req.method, 200, req.body, null));
    res.status(200).send();
  }
  catch(e) {
    await conn.rollback();
    util.logger(new Log('error', req.remoteIP, req.originalPath, '갤러리 좋아요 요청 오류', req.method, 500, req.body, e.stack));
    res.status(500).send();
  }
  finally { conn.release(); }
});

export default router