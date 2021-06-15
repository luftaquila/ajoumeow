import axios from 'axios';
import stream from 'stream';
import express from 'express';
import dateformat from 'dateformat';
import bodyParser from 'body-parser';

import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';

let router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

//const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;

router.get('/', util.isLogin, async (req, res) => {
  try {
    let record = await util.query(`SELECT * FROM record WHERE date='${req.query.date}' ORDER BY course;`);
    let verify = await util.query(`SELECT * FROM verify WHERE date='${req.query.date}' ORDER BY course;`);
    util.logger(new Log('info', req.remoteIP, req.originalPath, '인증 기록 요청', req.method, 200, req.query, verify));
    res.status(200).json(new Response('success', record, verify));
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '인증 기록 요청 오류', req.method, 500, req.query, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

router.post('/', util.isLogin, async (req, res) => {
  try {
    let payload = JSON.parse(req.body.data);
    let result = [];
    for(let obj of payload) {
      let att = await util.query(`INSERT INTO verify(ID, date, name, course, score) VALUES(${obj.ID}, '${obj.date}', '${obj.name}', '${obj.course}', '${obj.score}');`);
      result.push(att);
    }
    util.logger(new Log('info', req.remoteIP, req.originalPath, '급식 인증', req.method, 201, req.body, result));
    res.status(201).json(new Response('success', null, result));
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '급식 인증 오류', req.method, 500, req.body, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

router.delete('/', util.isLogin, async (req, res) => {
  try {
    let payload = JSON.parse(req.body.data);
    let result = [];
    for(let obj of payload) {
      let att = await util.query(`DELETE FROM verify WHERE ID=${obj.ID} AND date='${obj.date}' AND name='${obj.name}' AND course='${obj.course}';`);
      result.push(att);
    }
    util.logger(new Log('info', req.remoteIP, req.originalPath, '급식 인증 삭제', req.method, 204, req.body, result));
    res.status(204).json(new Response('success', null, result));
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '급식 인증 삭제 오류', req.method, 500, req.body, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

router.get('/latest', util.isLogin, async (req, res) => {
  try {
    let result = await util.query(`SELECT * FROM verify ORDER BY date DESC LIMIT 1;`);
    util.logger(new Log('info', req.remoteIP, req.originalPath, '최근 급식 인증 날짜 요청', req.method, 200, req.query, result));
    res.status(200).json(new Response('success', null, result[0]));
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '최근 급식 인증 날짜 요청 오류', req.method, 500, req.query, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

router.get('/1365', async (req, res) => {
  try {
    const verify = await util.query(`SELECT * FROM verify WHERE date BETWEEN '${req.query.start}' AND '${req.query.end}';`);
    const namelist = await util.query(`SELECT * FROM \`namelist_${req.query.namelist}\`;`);
    const cheif = namelist.find(o => o.role == '회장');
    
    let payload = [];
    for(const activity of verify) {
      const member = namelist.find(o => o.ID == activity.ID);
      if(!member) continue;

      activity.date = dateformat(activity.date, 'yyyy.mm.dd');
      
      const prev = payload.find(data => data.ID == member.ID && data.date == activity.date);
      if(prev) prev.hour++;
      else {
        payload.push({
          ID: member.ID,
          volID: member['1365ID'],
          name: member.name,
          birthday: member.birthday,
          phone: member.phone,
          date: activity.date,
          hour: 1
        });
      }
    }
    
    const response = await axios.post('https://script.google.com/macros/s/AKfycbwwUFoQvlCziFm_2rvyyx1qcc7VeG2plfwEkXNNCWDQRBJqKRt_noiT36iCPlGCc_nIIA/exec', {
      data: payload,
      cheif: {
        name: cheif ? cheif.name : '',
        phone: cheif ? cheif.phone : ''
      }
    });
    
    res.json(response.data);
    util.logger(new Log('info', req.remoteIP, req.originalPath, '1365 인증서 생성 요청', req.method, 200, req.query, null));
  }
  catch(e) {
    console.error(e);
    util.logger(new Log('error', req.remoteIP, req.originalPath, '1365 인증서 생성 오류', req.method, 500, req.query, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

export default router
