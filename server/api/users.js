import express from 'express';
import dateformat from 'dateformat';
import bodyParser from 'body-parser';

import logger from '../config/winston';
import util from '../controllers/util/util.js';
import Response from '../controllers/util/response.js';

let router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

//const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;

// Get namelist table by semister
router.get('/list', util.isAdmin, async (req, res) => {
  try {
    if(req.query.semister == 'all') {
      let result = await util.query(`SHOW TABLES LIKE '%namelist_%';`);
      let map = result.map(x => x['Tables_in_ajoumeow (%namelist_%)']);
      res.status(200).json(new Response('success', null, map));
    }
    else {
      let result = await util.query(`SELECT * FROM \`namelist_${req.query.semister}\`;`);
      res.status(200).json(new Response('success', null, result));
    }
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

// Get users info by name
router.get('/name', util.isAdmin, async (req, res) => {
  try {
    let result = await util.query(`SELECT name, ID FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE name LIKE '%${req.query.query}%';`);
    res.status(200).json(new Response('success', null, result));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

// Get user info by id
router.get('/id', util.isAdmin, async (req, res) => {
  
});

// Add new user
router.post('/id', async (req, res) => {
  try {
    // check if applied before
    let namelists = await util.query(`SHOW TABLES LIKE '%namelist_%';`);
    namelists = namelists.map(x => x['Tables_in_ajoumeow (%namelist_%)']).reverse();

    let currentNamelist = null;
    if(namelists.indexOf(`namelist_${await util.getSettings('currentSemister')}`) != -1)
      currentNamelist = namelists.splice(namelists.indexOf(`namelist_${await util.getSettings('currentSemister')}`), 1);

    for(let namelist of namelists) {
      const test = await util.query(`SELECT ID FROM \`${namelist}\` WHERE ID=${req.body['학번']};`);
      if(req.body.new == 'true' && test.length) return res.status(400).json(new Response('error', '지난 학기에 가입한 적이 있습니다.<br>기존 회원으로 등록해 주세요.', 'ERR_REGISTERED_BEFORE'));
      else if(req.body.new == 'false' && !test.length) return res.status(400).json(new Response('error', '기존 회원이 아닙니다.<br>신입 회원으로 등록해 주세요.', 'ERR_NEVER_REGISTERED'));
    }

    // check if applied again
    if(currentNamelist) {
      const test = await util.query(`SELECT ID FROM \`${currentNamelist}\` WHERE ID=${req.body['학번']};`);
      if(test.length) return res.status(400).json(new Response('error', '이미 이번 학기 회원으로 등록되셨습니다.', 'ERR_ALREADY_REGISTERED'));
    }
    
    // check if user just lookuped
    if(!req.body['이름']) {
      let tmp = await util.getSettings('currentSemister'), semister;
      tmp = tmp.split('-');
      if(tmp[1] == '2') semister = tmp[0] + '-1';
      else semister = (Number(tmp[0]) - 1) + '-2';
      semister = `namelist_${semister}`;
      
      let result = await util.query(`SELECT * FROM \`${semister}\` WHERE ID=${req.body['학번']};`);
      return res.status(200).json(new Response('success', null, result));
    }

    /* proceeding apply */
    // create table if current semister's namelist not exists
    if(!currentNamelist) {
      await util.query("CREATE TABLE `namelist_" + await util.getSettings('currentSemister') + "` (" +
            "`college` varchar(10) not null," +
            "`department` varchar(15) not null," +
            "`ID` int(11) not null," +
            "`name` varchar(10) not null," +
            "`phone` varchar(15) not null," +
            "`birthday` varchar(10)," +
            "`1365ID` varchar(30)," +
            "`register` varchar(20)," +
            "`role` varchar(10) default '회원'," +
            "PRIMARY KEY (`ID`)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8;");
    }
    let result = await util.query(`INSERT INTO \`namelist_${await util.getSettings('currentSemister')}\`(college, department, ID, name, phone, birthday, 1365ID, register, role) VALUES('${req.body['단과대학']}', '${req.body['학과']}', ${req.body['학번']}, '${req.body['이름']}', '${req.body['전화번호']}', '${req.body['생년월일']}', '${req.body['1365 아이디']}', '${req.body['가입 학기']}', '${req.body['직책']}');`);
    res.status(200).json(new Response('success', null, result));
  }
  catch(e) {
    console.log(e);
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

// Modify user info by id
router.put('/id', util.isAdmin, async (req, res) => {
  try {
    let result = await util.query(`UPDATE \`namelist_${await util.getSettings('currentSemister')}\` SET college='${req.body.college}', department='${req.body.department}', name='${req.body.name}', phone='${req.body.phone}', birthday='${req.body.birthday}', 1365ID='${req.body['1365ID']}', role='${req.body.role}', register='${req.body.register}' WHERE ID=${req.body.ID};`);
    res.status(200).json(new Response('success', null, result));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

// Delete user by id
router.delete('/id', util.isAdmin, async (req, res) => {
  try {
    if(!req.body.ID) req.body.ID = 0;
    let result = await util.query(`DELETE FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE ID=${req.body.ID}`);
    if(result.affectedRows) res.status(200).json(new Response('success', null, result));
    else res.status(400).json(new Response('error', 'No matching ID', 'ERR_NO_MATCHING_ID'));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

// register user
router.post('/register', async (req, res) => {
  try {
    // check if registered again
    let registers = await util.query(`SHOW TABLES LIKE '%register_%';`);
    registers = registers.map(x => x['Tables_in_ajoumeow (%register_%)']).reverse();

    let currentRegister = null;
    if(registers.indexOf(`register_${await util.getSettings('currentSemister')}`) != -1)
      currentRegister = registers.splice(registers.indexOf(`register_${await util.getSettings('currentSemister')}`), 1);

    if(currentRegister) {
      const test = await util.query(`SELECT ID FROM \`${currentRegister}\` WHERE ID=${req.body['학번']};`);
      if(test.length) return res.status(400).json(new Response('error', '이미 가입 신청하셨습니다!<br>조금만 기다리시면 임원진이 연락을 드릴 거에요.', 'ERR_ALREADY_REGISTERED'));
    }
    
    /* proceeding register */
    // create table if current semister's register table not exists
    if(!currentRegister) {
      await util.query("CREATE TABLE `register_" + await util.getSettings('currentSemister') + "` (" +
            "`timestamp` timestamp," +
            "`ID` int(11) not null," +
            "`name` varchar(10) not null," +
            "`college` varchar(10) not null," +
            "`department` varchar(15) not null," +
            "`phone` varchar(15) not null," +
            "PRIMARY KEY (`ID`)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8;");
    }
    let result = await util.query(`INSERT INTO \`register_${await util.getSettings('currentSemister')}\`(ID, name, college, department, phone) VALUES(${req.body['학번']}, '${req.body['이름']}', '${req.body['단과대학']}', '${req.body['학과']}', '${req.body['연락처']}');`);
    res.status(200).json(new Response('success', null, result));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

export default router