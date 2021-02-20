import express from 'express';
import dateformat from 'dateformat';
import bodyParser from 'body-parser';

import logger from '../config/winston';
import util from '../controllers/util/util.js';
import Response from '../controllers/util/response.js';

let router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

//const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;

router.get('/', async (req, res) => {
  try {
    const result = await util.query(`SELECT * FROM record WHERE date BETWEEN '${req.query.startDate}' AND '${req.query.endDate} ' ORDER BY date, course, timestamp;`);
    const update = await util.query(`SELECT UPDATE_TIME FROM information_schema.tables WHERE TABLE_SCHEMA='ajoumeow' AND TABLE_name='record';`);
    res.status(200).json(new Response('success', update, result));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

router.post('/', util.isLogin, async (req, res) => {
  try {
    const payload = req.body;
    const test = await util.query(`SELECT * FROM record WHERE ID=${payload.ID} AND name='${payload.name}' AND date='${payload.date}' AND course='${payload.course}'`);
    if(test.length) {
      //logger.info();
      res.status(400).json(new Response('error', 'Duplicated entry', 'ERR_DUP_ENTRY'));
    }
    const result = await util.query(`INSERT INTO record(ID, name, date, course) VALUES(${payload.ID}, '${payload.name}', '${payload.date}', '${payload.course}');`);
    res.status(201).json(new Response('success', 'Successfully applied', result));
  }
  catch(e) {
    //logger.error();
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

router.delete('/', util.isLogin, async (req, res) => {
  try {
    const result = await util.query(`DELETE FROM record WHERE ID=${req.body.ID} AND name='${req.body.name}' AND date='${req.body.date}' AND course='${req.body.course}';`);
    res.status(201).json(new Response('success', 'Successfully deleted', result));
  }
  catch(e) {
    //logger.error();
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

router.get('/statistics', async (req, res) => {
  try {
    let data = [], verify = null;
    let namelist = await util.query(`SELECT * FROM \`namelist_${await util.getSettings('currentSemister')}\`;`);
    switch(req.query.type) {
      case 'summary':
        verify = await util.query(`SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='${dateformat(new Date(), 'yyyymm')}';`);
        for(let obj of verify) {
          let person = data.find(o => o.ID == obj.ID);
          if(!person) {
            let member = namelist.find(o => o.ID == obj.ID);
            if(member) data.push({ ID: member.ID });
          }
        }
        const payload = {
          time: verify.length,
          people: data.length,
          total: namelist.length
        };
        
        return res.status(200).json(new Response('success', null, payload));
        
      case 'this_feeding':
        verify = await util.query(`SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='${dateformat(new Date(), 'yyyymm')}';`);
        break;
        
      case 'this_total':
        verify = await util.query(`SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='${dateformat(new Date(), 'yyyymm')}';`);
        break;
        
      case 'prev_feeding':
        let date = new Date();
        date.setMonth(date.getMonth() - 1);
        verify = await util.query(`SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='${dateformat(date, 'yyyymm')}';`);
        break;
        
      case 'total_total':
        verify = await util.query(`SELECT * FROM verify;`);
        break;
        
      case 'custom_total':
        let [start, end] = req.query.value.split('|');
        verify = await util.query(`SELECT * FROM verify WHERE date BETWEEN '${start}' AND '${end}';`);
        break;
        
      default:
        return res.status(400).json(new Response('error', 'ERR_INVAILD_TYPE', 'ERR_INVAILD_TYPE'));
    }
    
    for(let obj of verify) {
      if(obj.course.includes('코스')) {
        let person = data.find(o => o.ID == obj.ID);
        if(person) person.score = person.score + Number(obj.score);
        else {
          let member = namelist.find(o => o.ID == obj.ID);
          if(member) {
            data.push({
              ID: member.ID,
              name: member.name,
              score: Number(obj.score)
            });
          }
        }
      }
    }
    res.status(200).json(new Response('success', null, data));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

router.get('//mapLoad', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  logger.info('Google Maps Javascript API map rendering call', { ip: ip, url: 'mapLoad', query: '-', result: 'ID: ' + (req.session.ID ? req.session.ID : 'ANONYMOUS') });
});

export default router