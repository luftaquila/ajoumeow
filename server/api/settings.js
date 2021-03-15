import dotenv from 'dotenv'
import express from 'express';
import bodyParser from 'body-parser';

import client from '../config/node-kakao'
import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';

dotenv.config();

let router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

router.get('*', async (req, res) => {
  try {
    let result = await util.getSettings(req.url.substring(1));
    util.logger(new Log('info', req.remoteIP, req.originalPath, '설정값 요청', req.method, 200, req.query, result));
    res.status(200).json(new Response('success', null, result));
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '설정값 요청 오류', req.method, 500, req.query, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

router.put('*', util.isAdmin, async (req, res) => {
  try {
    let result = await util.query(`UPDATE settings SET value='${req.body.data}' WHERE name='${req.url.substring(1)}'`);
    util.logger(new Log('info', req.remoteIP, req.originalPath, '설정값 수정', req.method, 200, req.body, result));
    res.status(200).json(new Response('success', null, result));
    if(req.url.substring(1) == 'currentSemister') {
      const target = client.channelManager.map.get(process.env.noticeChannelId);
      await target.sendText('시스템에서 현재 학기 설정이 변경되었습니다!\n\n 새 학기에도 미유미유와 함께하실 기존 회원 분들께서는 사이트에서 회원 등록 -> 기존 회원을 선택해 새 학기 명단에 등록해 주세요. 새 학기에도 화이팅!');
    }
  }
  catch(e) {
    util.logger(new Log('error', req.remoteIP, req.originalPath, '설정값 수정 오류', req.method, 500, req.body, e.stack));
    res.status(500).json(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
  }
});

export default router