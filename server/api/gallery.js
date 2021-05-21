import path from 'path';
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
    res.send(result);
  }
  catch(e) {
    
  }
});

router.get('/photo', async (req, res) => {
  const row = { latest: 'timestamp', popular: 'likes' };
  try {
    const result = await util.query(`SELECT * FROM gallery_photo ORDER BY ${row[req.query.sort]} DESC LIMIT 10 OFFSET ${req.query.offset};`);
    for(const i in result) {
      const tags = await util.query(`SELECT tag_name FROM gallery_photo_tag WHERE photo_id='${result[i].photo_id}';`);
      result[i].tags = tags.map(x => x.tag_name);
    }
    res.send(result);
  }
  catch(e) {
  
  }
});

router.post('/photo', util.isLogin, upload.any(), async (req, res) => {
  const conn = await pool.getConnection();
  try {
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
    res.json();
  }
  catch(e) {
    console.error(e);
    await conn.rollback();
  }
  finally { conn.release(); }
});

router.post('/like', async (req, res) => {
  console.log(req.body);
  res.send('ok');
});

export default router