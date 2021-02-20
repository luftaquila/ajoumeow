import axios from 'axios';
import stream from 'stream';
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

router.get('/1365', async (req, res) => {
  try {
    let verify = await util.query(`SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='${req.query.month.replace('-', '')}';`);
    let namelist = await util.query(`SELECT * FROM \`namelist_${req.query.namelist}\`;`);
    let data = [];
    for(let obj of verify) {
      let person = data.find(o => o.ID == obj.ID);
      if(person) {
        let day = person.date.find(o => +o.day == +obj.date);
        if(day) day.hour++;
        else {
          person.date.push({
            day: obj.date,
            hour: 1
          });
        }
      }
      else {
        let member = namelist.find(o => o.ID == obj.ID);
        if(member) {
          data.push({
            ID: member.ID,
            name: member.name,
            '1365ID' : member['1365ID'],
            birthday: member.birthday,
            date: [ { day: obj.date, hour: 1 } ]
          });
        }
      }
    }
    const response = await axios.post('https://script.google.com/macros/s/AKfycbyh61pZAydKAa_CWzd2z26e3mLyHG-qsvA69LO7E7eokh5Nzh3LdhP_/exec', { data: JSON.stringify(data) });
    const pdf = Buffer.from(response.data, 'base64');
    
    let readStream = new stream.PassThrough();
    readStream.end(pdf);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename=${encodeURI('미유미유 1365 인증서.pdf')}`);
    res.set('Content-Length', pdf.length);
    readStream.pipe(res);
  }
  catch(e) {
    console.log(e);
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

export default router