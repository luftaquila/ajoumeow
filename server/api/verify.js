import express from 'express';
import dateformat from 'dateformat';
import bodyParser from 'body-parser';

import logger from '../config/winston';
import util from '../controllers/util/util.js';
import Response from '../controllers/util/response.js';

let router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

//const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;

router.get('/', util.isLogin, async (req, res) => {
  try {
    let record = await util.query(`SELECT * FROM record WHERE date='${req.query.date}' ORDER BY course;`);
    let verify = await util.query(`SELECT * FROM verify WHERE date='${req.query.date}' ORDER BY course;`);
    res.status(200).json(new Response('success', record, verify));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

router.post('/', util.isLogin, async (req, res) => {
  try {
    let payload = JSON.parse(req.body.data);
    for(let obj of payload) {
      await util.query(`INSERT INTO verify(ID, date, name, course, score) VALUES(${obj.ID}, '${obj.date}', '${obj.name}', '${obj.course}', '${obj.score}');`);
      //logger.info('급식을 인증합니다.', { ip: ip, url: 'verify', query: query, result: JSON.stringify(result)});
    }
    res.status(200).json(new Response('success', null, null));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

router.delete('/', util.isLogin, async (req, res) => {
  try {
    let payload = JSON.parse(req.body.data);
    for(let obj of payload) {
      await util.query(`DELETE FROM verify WHERE ID=${obj.ID} AND date='${obj.date}' AND name='${obj.name}' AND course='${obj.course}';`);
      //logger.info('급식 인증을 삭제합니다.', { ip: ip, url: 'deleteVerify', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
    }
    res.status(200).json(new Response('success', null, null));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

router.get('/latest', util.isLogin, async (req, res) => {
  try {
    let result = await util.query(`SELECT * FROM verify ORDER BY date DESC LIMIT 1;`);
    res.status(200).json(new Response('success', null, result[0]));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});


export default router