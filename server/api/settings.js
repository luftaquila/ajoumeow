import dotenv from 'dotenv'
import express from 'express';
import dateformat from 'dateformat';
import bodyParser from 'body-parser';

import logger from '../config/winston';
import util from '../controllers/util/util.js';
import Response from '../controllers/util/response.js';

dotenv.config();

let router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

router.get('*', async (req, res) => {
  try {
    let result = await util.getSettings(req.url.substring(1));
    res.status(200).json(new Response('success', '', result));
  }
  catch(e) {
    //logger.error();
    console.log(e);
    res.status(500).json(new Response('error', e.message, 'ERR'));
  }
});

router.put('*', util.isAdmin, async (req, res) => {
  try {
    let result = await util.query(`UPDATE settings SET value='${req.body.data}' WHERE name='${req.url.substring(1)}'`);
    res.status(200).json(new Response('success', '', result));
    /*
    if(req.url.substring(1) == 'currentSemister') {
      const target = client.channelManager.map.get(process.env.noticeChannelId);
      await target.sendText('시스템 현재 학기가 변경되었습니다!\n\n 기존 회원 분들은 사이트의 회원 등록 - 기존 회원 메뉴를 통해 새 학기 명단에 다시 등록해 주세요. 새 학기에도 화이팅!');
    }
    */
  }
  catch(e) {
    //logger.error();
    console.log(e);
    res.status(500).json(new Response('error', e.message, 'ERR'));
  }
});

export default router