import dotenv from 'dotenv'
import express from 'express';
import jwt from 'jsonwebtoken';
import dateformat from 'dateformat';
import bodyParser from 'body-parser';

import logger from '../config/winston';
import util from '../controllers/util/util.js';
import Response from '../controllers/util/response.js';

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
        res.status(200).json(new Response('success', token, { user: result[0], statistics: statistics, semister: semister }));
      }
      else // if no corresponding user exists
        res.status(400).json(new Response('error', semister, 'ERR_NOT_REGISTERED'));
    }
    else // if id field does not exists
      res.status(400).json(new Response('error', '', 'ERR_INVAILD_ID'));
  }
  catch(e) {
    //logger.error();
    console.log(e);
    res.status(500).json(new Response('error', '', 'ERR_UNKNOWN'));
  }
});

router.post('/autologin', util.isLogin, async (req, res) => {
  try {
    if(req.decoded.id) { // if id field exists
      const result = await util.query(`SELECT name, ID, role FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE ID='${req.decoded.id}';`);
      const semister = await util.getSettings('currentSemister');

      if(result.length) { // if corresponding user exists
        const statistics = await util.query(`SELECT date, course, score FROM verify WHERE id=${req.decoded.id} ORDER BY date DESC;`);
        res.status(200).json(new Response('success', null, { user: result[0], statistics: statistics, semister: semister }));
      }
      else // if no corresponding user exists
        res.status(400).json(new Response('error', semister, 'ERR_NOT_REGISTERED'));
    }
    else // if id field does not exists
      res.status(400).json(new Response('error', '', 'ERR_INVAILD_ID'));
  }
  catch(e) {
    //logger.error();
    console.log(e);
    res.status(500).json(new Response('error', '', 'ERR_UNKNOWN'));
  }
});

router.post('/logout', util.isLogin, async (req, res) => {
  req.session.destroy();
  res.send({ 'result' : 'success' });
  logger.info('로그아웃을 시도합니다.', { ip: ip, url: 'logout', query: 'logout', result: 'ok'});
});


export default router