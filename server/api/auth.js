import dotenv from 'dotenv'
import express from 'express';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';

import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';

dotenv.config();

let router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

//const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;

router.post('/login', async (req, res) => {
  try {
    if(req.body.id) { // if id field exists
      const result = await util.query(`SELECT name, ID, role FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE ID='${req.body.id}';`);
      const semister = await util.getSettings('currentSemister');

      if(result.length) { // if corresponding user exists
        const token = jwt.sign(req.body, process.env.JWTSecret, { expiresIn: '365d' });
        const statistics = await util.query(`SELECT date, course, score FROM verify WHERE id=${req.body.id} ORDER BY date DESC;`);
        util.logger(new Log('info', req.remoteIP, req.originalPath, '로그인 요청', req.method, 200, req.body, token));
        res.status(200).json(new Response('success', token, { user: result[0], statistics: statistics, semister: semister }));
      }
      else { // if no corresponding user exists
        util.logger(new Log('info', req.remoteIP, req.originalPath, '로그인 요청', req.method, 400, req.body, 'ERR_NOT_REGISTERED'));
        res.status(400).json(new Response('error', '등록되지 않은 학번입니다.', 'ERR_NOT_REGISTERED'));
      }
    }
    else { // if id field does not exists
      util.logger(new Log('info', req.remoteIP, req.originalPath, '로그인 요청', req.method, 400, req.body, 'ERR_INVALID_ID'));
      res.status(400).json(new Response('error', '유효하지 않은 학번입니다.', 'ERR_INVALID_ID'));
    }
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '로그인 요청 오류', req.method, 500, req.body, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

router.post('/autologin', util.isLogin, async (req, res) => {
  try {
    if(req.decoded.id) { // if id field exists
      const result = await util.query(`SELECT name, ID, role FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE ID='${req.decoded.id}';`);
      const semister = await util.getSettings('currentSemister');

      if(result.length) { // if corresponding user exists
        const statistics = await util.query(`SELECT date, course, score FROM verify WHERE id=${req.decoded.id} ORDER BY date DESC;`);
        util.logger(new Log('info', req.remoteIP, req.originalPath, '자동 로그인', req.method, 200, req.decoded, result[0]));
        res.status(200).json(new Response('success', null, { user: result[0], statistics: statistics, semister: semister }));
      }
      else { // if no corresponding user exists
        util.logger(new Log('info', req.remoteIP, req.originalPath, '자동 로그인', req.method, 400, req.decoded, 'ERR_NOT_REGISTERED'));
        res.status(400).json(new Response('error', '등록되지 않은 학번입니다.', 'ERR_NOT_REGISTERED'));
      }
    }
    else { // if id field does not exists
      util.logger(new Log('info', req.remoteIP, req.originalPath, '자동 로그인', req.method, 400, req.decoded, 'ERR_INVALID_ID'));
      res.status(400).json(new Response('error', '유효하지 않은 학번입니다.', 'ERR_INVALID_ID'));
    }
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '자동 로그인 오류', req.method, 500, req.decoded, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

export default router