import path from 'path';
import express from 'express';
import dateformat from 'dateformat';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';

import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';

let router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

//const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;

router.get('/', async (req, res) => {
  try {
    let result = await util.query(`SELECT * FROM record WHERE date BETWEEN '${req.query.startDate}' AND '${req.query.endDate} ' ORDER BY date, course, timestamp;`);
    const update = await util.query(`SELECT UPDATE_TIME FROM information_schema.tables WHERE TABLE_SCHEMA='ajoumeow' AND TABLE_name='record';`);
    // user role detection
    const token = req.headers['jwt'];
    if(token) {
      await jwt.verify(token, process.env.JWTSecret, async function(err, decoded) {
        if(err) result = await maskName(result, null);
        else result = await maskName(result, decoded.id);
      });
    }
    else result = await maskName(result, null);

    util.logger(new Log('info', req.remoteIP, req.originalPath, '급식 신청 기록 요청', req.method, 200, req.query, result));
    res.status(200).json(new Response('success', update, result));
    
    async function maskName(data, id) {
      if(id) {
        return data;
        /* NOT MASKING NAME IF LOGGED IN
        const user = await util.query(`SELECT role FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE id=${id}`);
        const role = user[0].role;
        
        if(role == '회원') {
          let mine = [];
          data.forEach(rec => {
            if(rec.ID == id) {
              rec.mine = true;
              mine.push(rec.date + rec.course);
            }
            else {
              rec.ID = null;
              rec.mine = false;
            }
          });
          
          data.forEach(rec => {
            const isTimePassed = new Date().setHours(0, 0, 0, 0) <= rec.date;
            const isPartner = mine.includes(rec.date + rec.course);
            
            if(isTimePassed && !isPartner) rec.name = rec.name[0] + rec.name.slice(1).replace(/./g , '○');
          });
          
          return data;
        }
        else return data;
        */
      }
      else {
        data.forEach(rec => {
          rec.name = rec.name[0] + rec.name.slice(1).replace(/./g , '○');
          rec.ID = null;
          rec.mine = false;
        });
        return data;
      }
    }
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '급식 신청 기록 요청 오류', req.method, 500, req.query, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

router.post('/', util.isLogin, async (req, res) => {
  try {
    const payload = req.body;
    const test = await util.query(`SELECT * FROM record WHERE ID=${payload.ID} AND name='${payload.name}' AND date='${payload.date}' AND course='${payload.course}'`);
    if(test.length) {
      util.logger(new Log('info', req.remoteIP, req.originalPath, '급식 신청', req.method, 400, req.body, 'ERR_DUP_ENTRY'));
      res.status(400).json(new Response('error', '이미 신청되었습니다.', 'ERR_DUP_ENTRY'));
    }
    else {
      const result = await util.query(`INSERT INTO record(ID, name, date, course) VALUES(${payload.ID}, '${payload.name}', '${payload.date}', '${payload.course}');`);
      util.logger(new Log('info', req.remoteIP, req.originalPath, '급식 신청', req.method, 201, req.body, result));
      res.status(201).json(new Response('success', null, result));
    }
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '급식 신청 오류', req.method, 500, req.body, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

router.delete('/', util.isLogin, async (req, res) => {
  try {
    const result = await util.query(`DELETE FROM record WHERE ID=${req.body.ID} AND name='${req.body.name}' AND date='${req.body.date}' AND course='${req.body.course}';`);
    util.logger(new Log('info', req.remoteIP, req.originalPath, '급식 신청 삭제', req.method, 204, req.body, result));
    res.status(204).json(new Response('success', null, result));
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '급식 신청 삭제 오류', req.method, 500, req.body, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

router.get('/statistics', async (req, res) => {
  try {
    let data = [], verify = null;
    switch(req.query.type) {
      case 'summary':
        verify = await util.query(`SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='${dateformat(new Date(), 'yyyymm')}';`);
        for(let obj of verify) {
          let person = data.find(o => o.ID == obj.ID);
          if(!person) data.push({ ID: obj.ID });
        }
        const payload = {
          time: verify.length,
          people: data.length
        };

        util.logger(new Log('info', req.remoteIP, req.originalPath, '급식 통계 요청', req.method, 200, req.query, payload));
        return res.status(200).json(new Response('success', null, payload));

      case 'this_feeding':
        verify = await util.query(`SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='${dateformat(new Date(), 'yyyymm')}' AND course REGEXP '[0-9]코스';`);
        break;

      case 'this_total':
        verify = await util.query(`SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='${dateformat(new Date(), 'yyyymm')}';`);
        break;

      case 'prev_feeding':
        verify = await util.query(`SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='${dateformat(new Date(new Date().setDate(0)), 'yyyymm')}' AND course REGEXP '[0-9]코스';`);
        break;

      case 'total_total':
        verify = await util.query(`SELECT * FROM verify;`);
        break;

      case 'custom_total':
        let [start, end] = req.query.value.split('|');
        verify = await util.query(`SELECT * FROM verify WHERE date BETWEEN '${start}' AND '${end}';`);
        break;

      default:
        util.logger(new Log('info', req.remoteIP, req.originalPath, '급식 통계 요청', req.method, 400, req.query, 'ERR_INVALID_TYPE'));
        return res.status(400).json(new Response('error', '유효하지 않은 통계 유형입니다.', 'ERR_INVALID_TYPE'));
    }

    for(let obj of verify) {
      let person = data.find(o => o.ID == obj.ID);
      if(person) {
        person.score += Number(obj.score);
        person.count++;
      }
      else {
        data.push({
          ID: obj.ID,
          name: obj.name,
          score: Number(obj.score),
          count: 1
        });
      }
    }
    util.logger(new Log('info', req.remoteIP, req.originalPath, '급식 통계 요청', req.method, 200, req.query, data));
    res.status(200).json(new Response('success', null, data));
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '급식 통계 요청', req.method, 500, req.query, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

router.get('/log', util.isAdmin, async(req, res) => {
  try {
    let check = [];
    if(req.query.level) check.push(`level REGEXP '${req.query.level.join('|')}'`);
    if(req.query.type) check.push(`IP REGEXP '${req.query.type.join('|')}'`);
    check = check.length ? (check.join(' AND ') + ' AND') : '';
    const query = `SELECT * FROM log WHERE ${check} timestamp BETWEEN '${req.query.start}' AND '${req.query.end}';`;
    const result = await util.query(query);
    res.status(200).json(new Response('success', null, result));
  }
  catch(e) {
    console.log(e);
    util.logger(new Log('error', req.remoteIP, req.originalPath, '로그 로드 오류', req.method, 500, req.query, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

router.get('/map', util.isLogin, async(req, res) => {
  try {
    util.logger(new Log('info', req.remoteIP, req.originalPath, '지도 파일 요청', req.method, 200, req.query, null));
    res.status(200).sendFile(path.join(__dirname, '../web/res/map.json'));
  }
  catch(e) {
    console.log(e);
    util.logger(new Log('error', req.remoteIP, req.originalPath, '지도 파일 요청 오류', req.method, 500, req.query, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

export default router
