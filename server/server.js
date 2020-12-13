require('dotenv').config();
require('../../res/dateFormat.js');

const fs = require('fs');
const envfile = require('envfile');
const request = require('request');
const express = require('express');
const mariadb = require('mariadb');
const winston = require('winston');
const nodeKakao = require('node-kakao');
const dateformat = require('dateformat');
const bodyParser = require('body-parser');
const session = require('express-session');
const sessionDatabase = require('express-mysql-session')(session);
const DBOptions = {
  host: process.env.DBHost, 
  user: process.env.DBUser,
  password: process.env.DBPW,
  database: process.env.DBName,
  idleTimeout: 0
};
const pool = mariadb.createPool(DBOptions);
const sessionDB = new sessionDatabase(DBOptions);
let db;

let logger = new winston.createLogger({
  transports: [
    new winston.transports.File({
      level: 'info',
      filename: 'server.log',
      maxsize: 10485760, //10MB
      maxFiles: 1,
      showLevel: true,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.json()
      )
    })
  ],
  exitOnError: false,
});

const client = new nodeKakao.TalkClient(process.env.TalkClientName, process.env.TalkClientUUID);
client.login(process.env.TalkClientLoginID, process.env.TalkClientLoginPW, true).then(kakaoClient);

const app = express();
//app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
 secret: process.env.sessionSecret,
 resave: false,
 saveUninitialized: true,
 store: sessionDB,
 cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 }
}));

app.get('/', async function(req, res) {
  
});

app.post('//loginCheck', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query = true, result;
  try {
    if(req.session.isLogin) {
      query = 'SELECT name, ID, role FROM `namelist_' + await settings('currentSemister') + "` WHERE ID='" + req.session.ID + "';";
      result = await db.query(query);
      res.send({ 'name' : result[0].name, 'id' : result[0].ID, 'role' : result[0].role, semister: await settings('currentSemister') });
      logger.info('세션의 로그인 여부를 확인합니다.', { ip: ip, url: 'loginCheck', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
    }
    else {
      res.send({ 'name' : null, 'id' : null, 'role' : null, semister: await settings('currentSemister') });
      logger.info('세션의 로그인 여부를 확인합니다.', { ip: ip, url: 'loginCheck', query: '-', result: 'Not logged in.' });
    }
  }
  catch(e) {
    res.send({ 'name' : null, 'id' : null, 'role' : null, semister: await settings('currentSemister') });
    logger.error('세션의 로그인 여부를 확인하는 중에 오류가 발생했습니다.', { ip: ip, url: 'loginCheck', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//login', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = 'SELECT name, ID, role FROM `namelist_' + await settings('currentSemister') + "` WHERE ID='" + req.body['ID'] + "';";
    result = await db.query(query);
    if(result[0]) {
      req.session.touch();
      req.session.ID = req.body['ID'];
      req.session.isLogin = true;
      res.send({ 'name' : result[0].name, 'id' : result[0].ID, 'role' : result[0].role, semister: await settings('currentSemister') });
      logger.info('로그인을 시도합니다.', { ip: ip, url: 'login', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
    }
    else {
      res.send({ 'name' : null, 'id' : null, 'role' : null, semister: await settings('currentSemister') });
      logger.info('로그인을 시도합니다.', { ip: ip, url: 'login', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
    } 
  }
  catch(e) {
    logger.error('로그인 시도 중에 오류가 발생했습니다.', { ip: ip, url: 'login', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//logout', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  req.session.destroy();
  res.send({ 'result' : 'success' });
  logger.info('로그아웃을 시도합니다.', { ip: ip, url: 'logout', query: 'logout', result: 'ok'});
});

app.post('//apply', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = 'SHOW TABLES;';
    result = await db.query(query)
    let flag = false;
    for(let obj of result) {
      if(obj['Tables_in_ajoumeow'].includes('namelist_' + await settings('currentSemister'))) flag = true;
    }
    if(!flag) {
      query = "CREATE TABLE `namelist_" + await settings('currentSemister') + "` (" +
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
              ") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
      result = await db.query(query);
    }

    query = 'INSERT INTO `namelist_' + await settings('currentSemister') + '`(college, department, ID, name, phone, birthday, 1365ID, register, role)' +
        " VALUES('" + req.body['단과대학'] + "', '" + req.body['학과'] + "', '" + req.body['학번'] + "', '" + req.body['이름'] + "', '" + req.body['전화번호'] + "', '" + req.body['생년월일'] + "', '" + req.body['1365 아이디'] + "', '" + req.body['가입 학기'] + "', '" + req.body['직책'] + "');";
    result = await db.query(query);
    res.send(result);
    logger.info('회원 등록을 시도합니다.', { ip: ip, url: 'apply', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
  }
  catch(e) {
    res.send({ 'result' : null, 'error' : e.toString() });
    logger.error('회원 등록 중에 오류가 발생했습니다.', { ip: ip, url: 'apply', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//requestApply', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  try {
    let applyTerm = await settings('applyTerm'), result;
    applyTerm = applyTerm.split('~');
  
    if((new Date() > new Date(applyTerm[0]) && new Date() < new Date(new Date(applyTerm[1]).getTime() + 60 * 60 * 24 * 1000)) || (await settings('isAllowAdditionalApply') == 'TRUE'))
      result = { 'result' : true, 'semister' : await settings('currentSemister') };
    else result = { result: null };
  
    res.send(result);
    //logger.info('회원 등록 가능 여부를 확인합니다.', { ip: ip, url: 'requestApply', query: '-', result: JSON.stringify(result)});
  }
  catch(e) {
    logger.error('회원 등록 가능 여부를 확인하는 중에 오류가 발생했습니다.', { ip: ip, url: 'requestApply', query: '-', result: e.toString()});
  }
});

app.post('//requestRegister', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  try {
    let registerTerm = await settings('registerTerm'), result;
    registerTerm = registerTerm.split('~');
  
    if((new Date() > new Date(registerTerm[0]) && new Date() < new Date(new Date(registerTerm[1]).getTime() + 60 * 60 * 24 * 1000)) || (await settings('isAllowAdditionalRegister') == 'TRUE'))
      result = { 'result' : true, 'semister' : await settings('currentSemister') };
    else result = { 'result' : null };
    res.send(result);
    //logger.info('회원 가입 가능 여부를 확인합니다.', { ip: ip, url: 'requestRegister', query: '-', result: JSON.stringify(result)});
  }
  catch(e) {
    logger.info('회원 가입 가능 여부를 확인하는 중에 오류가 발생했습니다.', { ip: ip, url: 'requestRegister', query: '-', result: e.toString()});
  }
});

app.post('//modifySettings', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    if(req.body.editParam == 'notice') {
      let version = await settings('notice');
      version = Number(version.split('$')[0]) + 1;
      let notice = req.body.editData.replace(/(?:\r\n|\r|\n)/g, '<br>');
      query = "UPDATE settings SET value='" + version + '$' + notice + "' WHERE name='" + req.body.editParam + "';";
    }
    else query = "UPDATE settings SET value='" + req.body.editData + "' WHERE name='" + req.body.editParam + "';";
    result = await db.query(query);
    res.send({ 'result' : true });
    logger.info('설정값 변경을 시도합니다.', { ip: ip, url: 'modifySettings', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
  }
  catch(e) { 
    res.send({ 'result' : null, 'error' : e.toString() });
    logger.error('설정값 변경 중에 오류가 발생했습니다.', { ip: ip, url: 'modifySettings', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//records', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = "SELECT * FROM record WHERE date BETWEEN '" + req.body.startDate + "' AND '" + req.body.endDate + "' ORDER BY date, course, timestamp;";
    result = [await db.query(query), await db.query("SELECT UPDATE_TIME FROM information_schema.tables WHERE TABLE_SCHEMA='ajoumeow' AND TABLE_name='record';")];
    res.send(result);
    //logger.info('급식표 데이터를 요청합니다.', { ip: ip, url: 'records', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
  }
  catch(e) {
    logger.error('급식표 데이터를 불러오는 중에 오류가 발생했습니다.', { ip: ip, url: 'records', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//requestSettings', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = 'SELECT * FROM settings;';
    result = await db.query(query);
    let reply = {};
    for(let obj of result) reply[obj.name] = obj.value;
    res.send(reply);
    //logger.info('설정값을 요청합니다.', { ip: ip, url: 'requestSettings', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
  }
  catch(e) {
    logger.error('설정값을 불러오는 중에 오류가 발생했습니다.', { ip: ip, url: 'requestSettings', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//requestSetting', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = "SELECT `value` FROM `settings` WHERE `name`='" + req.body.name + "';";
    result = await db.query(query);
    res.send(result[0]);
    //logger.info('설정값을 요청합니다.', { ip: ip, url: 'requestSettings', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
  }
  catch(e) { logger.error('설정값을 불러오는 중에 오류가 발생했습니다.', { ip: ip, url: 'requestSettings', query: query ? query : 'Query String Not generated.', result: e.toString()});  }
});

    
app.post('//requestNameList', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let semister, query, result;
  try {
    if(req.body.semister == 'this') semister = await settings('currentSemister');
    else if(req.body.semister == 'past') {
      let tmp = await settings('currentSemister');
      tmp = tmp.split('-');
      if(tmp[1] == '2') semister = tmp[0] + '-1';
      else semister = (Number(tmp[0]) - 1) + '-2';
    }
    else semister = req.body.semister;
    query = 'SELECT * FROM `namelist_' + semister + '`;';
    result = await db.query(query);
    res.send(result);
    //logger.info('회원 명단을 요청합니다.', { ip: ip, url: 'requestNameList', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
  }
  catch(e) {
    logger.error('회원 명단을 불러오는 중에 오류가 발생했습니다.', { ip: ip, url: 'requestNameList', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//isAllowedAdminConsole', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = 'SELECT role FROM `namelist_' + await settings('currentSemister') + "` WHERE ID='" + req.session.ID + "';";
    result = await db.query(query);
    if(result[0].role != "회원") res.send({ 'result' : true });
    else res.send({ 'result' : null });
    //logger.info('관리자 권한이 있는지 확인합니다.', { ip: ip, url: 'isAllowedAdminConsole', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
  }
  catch(e) {
    res.send({ 'result' : null, 'error' : e.toString() });
    logger.error('관리자 권한이 있는지 확인하는 중에 오류가 발생했습니다.', { ip: ip, url: 'isAllowedAdminConsole', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//modifyMember', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    let data = req.body;
    query = 'UPDATE `namelist_' + await settings('currentSemister') + "` SET college='" + data.college + "', department='" + data.department + "', name='" + data.name + "', phone='" + data.phone + "', birthday='" + data.birthday + "', 1365ID='" + data['1365ID'] + "', role='" + data.role + "', register='" + data.register + "' WHERE ID='" + data.ID + "';";
    result = await db.query(query);
    res.send({ 'result' : true });
    logger.info('회원 정보를 수정합니다.', { ip: ip, url: 'modifyMember', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
  }
  catch(e) {
    res.send({ 'result' : null, 'error' : e.toString() });
    logger.error('회원 정보를 수정하는 중에 오류가 발생했습니다.', { ip: ip, url: 'modifyMember', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//deleteMember', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = "DELETE FROM `namelist_" + await settings('currentSemister') + "` WHERE ID=" + req.body.delete + ";";
    result = await db.query(query);
    if(result.affectedRows) {
      res.send({ 'result' : true });
      logger.info('회원을 제명합니다.', { ip: ip, url: 'deleteMember', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
    }
    else {
      res.send({ 'result' : null });
      logger.info('회원을 제명합니다.', { ip: ip, url: 'deleteMember', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
    }
  }
  catch(e) {
    res.send({ 'result' : null });
    logger.error('회원을 제명하는 중에 오류가 발생했습니다.', { ip: ip, url: 'deleteMember', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//insertIntoTable', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    let payload = req.body;
    query = "SELECT * FROM record WHERE ID=" + payload.ID + " AND name='" + payload.name + "' AND date='" + payload.date + "' AND course='" + payload.course + "';";
    let test = await db.query(query);
    if(test.length) {
      logger.info('급식을 신청했지만 중복 신청으로 거부되었습니다.', { ip: ip, url: 'insertIntoTable', query: query ? query : 'Query String Not generated.', result: test});
      return res.status(406).send({ 'result' : null, 'error' : { 'code' : 'DUP_RECORD' } }); 
    }
    query = "INSERT INTO record(ID, name, date, course) VALUES(" + payload.ID + ", '" + payload.name + "', '" + payload.date + "', '" + payload.course + "');";
    result = await db.query(query);
    res.send({ 'result' : true });
    logger.info('급식을 신청합니다.', { ip: ip, url: 'insertIntoTable', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
  }
  catch(e) {
    res.status(406).send({ 'result' : null, 'error' : e });
    logger.error('급식을 신청하는 중에 오류가 발생했습니다.', { ip: ip, url: 'insertIntoTable', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//deleteFromTable', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    let payload = req.body;
    query = "DELETE FROM record WHERE ID=" + payload.ID + " AND name='" + payload.name + "' AND date='" + payload.date + "' AND course='" + payload.course + "';";
    result = await db.query(query);
    res.send({ 'result' : true });
    logger.info('급식 신청을 삭제합니다.', { ip: ip, url: 'deleteFromTable', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
  }
  catch(e) {
    res.send({ 'result' : null, 'error' : e.toString() });
    logger.error('급식 신청을 삭제하는 중에 오류가 발생했습니다.', { ip: ip, url: 'deleteFromTable', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//requestVerifyList', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let record, verify, result;
  try {
    record = await db.query("SELECT * FROM record WHERE date='" + req.body.date + "' ORDER BY course;");
    verify = await db.query("SELECT * FROM verify WHERE date='" + req.body.date + "' ORDER BY course;");
    result = { 'record' : record, 'verify' : verify };
    res.send(result);
    //logger.info('급식 인증 기록을 요청합니다.', { ip: ip, url: 'requestVerifyList', query: '-', result: JSON.stringify(result)});
  }
  catch(e) {
    logger.error('급식 인증 기록을 요청하는 중에 오류가 발생했습니다.', { ip: ip, url: 'requestVerifyList', query: '-', result: e.toString()});
  }
});

app.post('//verify', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result
  try {
    let payload = JSON.parse(req.body.data);
    for(let obj of payload) {
      query = "INSERT INTO verify(ID, date, name, course, score) VALUES(" + obj.ID + ", '" + obj.date + "', '" + obj.name + "', '" + obj.course + "', '" + obj.score + "');";
      result = await db.query(query);
      logger.info('급식을 인증합니다.', { ip: ip, url: 'verify', query: query, result: JSON.stringify(result)});
    }
    res.send({ 'result' : true });
  }
  catch(e) {
    res.status(406).send({ 'error' : e.toString() });
    logger.error('급식을 인증하는 중에 오류가 발생했습니다.', { ip: ip, url: 'verify', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//deleteVerify', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    let payload = JSON.parse(req.body.data);
    for(let obj of payload) {
      query = "DELETE FROM verify WHERE ID=" + obj.ID + " AND date='" + obj.date + "' AND name='" + obj.name + "' AND course='" + obj.course + "';";
      result = await db.query(query);
      logger.info('급식 인증을 삭제합니다.', { ip: ip, url: 'deleteVerify', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
    }
    res.send({ 'result' : true });
  }
  catch(e) {
    res.status(406).send({ 'error' : e.toString() });
    logger.error('급식 인증을 삭제하는 중에 오류가 발생했습니다.', { ip: ip, url: 'deleteVerify', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//requestLatestVerify', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = "SELECT * FROM verify ORDER BY date DESC LIMIT 1;";
    result = await db.query(query);
    res.send(result);
    //logger.info('마지막으로 인증한 날짜를 요청합니다.', { ip: ip, url: 'requestLatestVerify', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
  }
  catch(e) {
    logger.error('마지막으로 인증한 날짜를 요청하는 중에 오류가 발생했습니다.', { ip: ip, url: 'requestLatestVerify', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//requestNamelistTables', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    let data = [];
    query = 'SHOW TABLES;';
    result = await db.query(query);
    for(let obj of result) {
      if(obj['Tables_in_ajoumeow'].includes('namelist')) data.push(obj);
    }
    res.send(data);
    //logger.info('회원 명단 테이블 이름 목록을 요청합니다.', { ip: ip, url: 'requestNamelistTables', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
  }
  catch(e) {
    logger.error('회원 명단 테이블 이름 목록을 요청하는 중에 오류가 발생했습니다.', { ip: ip, url: 'requestNamelistTables', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//request1365', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  try {
  let verify = await db.query("SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='" + req.body.month.replace('-', '') + "';");
  let namelist = await db.query("SELECT * FROM `" + req.body.namelist + "`;");
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
  /*
  const getDaysInMonth = (month, year) => (new Array(31)).fill('').map((v, i) => new Date(year, month - 1, i + 1)).filter(v => v.getMonth() === month - 1);
  let [year, month] = req.body.month.split('-'), data = [];

  for(let date of getDaysInMonth(Number(month), Number(year))) {
    let people = [];
    for(let record of verify) {
      if(+record.date == +date) {
        let person = people.find(o => o.ID == record.ID);
        if(person) person.hour++;
        else {
          let human = namelist.find(o => o.ID == record.ID);
          if(human) {
            people.push({
              ID: human.ID,
              name : human.name,
              birthday: human.birthday,
              '1365ID' : human['1365ID'],
              hour : 1
            });
          }
        }
      }
    }
    data.push({
      date: date,
      people: people
    });
  }
  */
  request.post({
    url: 'https://script.google.com/macros/s/AKfycbw3VnMUXHLQJY5Te8aFX1uJLR0wQt2y5XMvvNaLQnPbLJ59UiQ/exec',
    body: JSON.stringify(data),
    followAllRedirect: true
  },
  function(error, response, body) {
    if (error) console.log(error);
    else {
      request(response.headers['location'], function(error, response, data) {
        let buf = Buffer.from(data, 'base64');
        fs.writeFile('인증서.pdf', buf, error => {
          if (error) throw error;
        });
        res.send({ result : true });
      });
    }
  });
  logger.info('1365 인증서를 요청합니다.', { ip: ip, url: 'request1365', query: '-', result: 'ok'});
  }
  catch(e) {
    logger.error('1365 인증서를 요청하는 중에 오류가 발생했습니다.', { ip: ip, url: 'request1365', query: '-', result: e.toString()});
  }
});

app.get('//download1365', function(req, res) {
  res.download('인증서.pdf');
});

app.post('//requestNotice', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = "SELECT value FROM settings WHERE name='notice';";
    result = await db.query(query);
    let notice = result[0].value.split('$');
    res.send({ 'result' : true, 'version' : notice[0], 'notice' : notice[1] });
    //logger.info('공지사항을 불러옵니다.', { ip: ip, url: 'requestNotice', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result)});
  }
  catch(e) {
    logger.error('공지사항을 불러오는 중에 오류가 발생했습니다.', { ip: ip, url: 'requestNotice', query: query ? query : 'Query String Not generated.', result: e.toString()});
  }
});

app.post('//requestLogs', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  try {
    fs.readFile('/home/luftaquila/HDD/ajoumeow/server/server.log', 'utf8', function(err, data) {
      if(err) {
        console.log(err)
        return res.send([{ timestamp: null, ip: null, message: null, query: null, result: null, level: null, url: null }]);
      }
      let array = data.split('\n');
      array.pop();
      for(let i in array) {
        array[i] = JSON.parse(array[i]);
        if(array[i].result.length > 100)
          array[i].result = array[i].result.substring(0, 100) + ' ...';
      }
      res.send(array);
    });
  }
  catch(e) {
    console.log(e)
  }
});

app.post('//requestStat', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let result;
  try {
    let data = [];
    let verify = await db.query("SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='" + dateformat(new Date(), 'yyyymm') + "';");
    let namelist = await db.query("SELECT * FROM `namelist_" + await settings('currentSemister') + "`;");

    for(let obj of verify) {
      let person = data.find(o => o.ID == obj.ID);
      if(!person) {
        let member = namelist.find(o => o.ID == obj.ID);
        if(member) data.push({ ID: member.ID });
      }
    }
    result = {
      time: verify.length,
      people: data.length,
      total: namelist.length
    };
    res.send(result);
    //logger.info('활동 통계를 불러옵니다.', { ip: ip, url: 'requestStat', query: '-', result: JSON.stringify(result)});
  }
  catch(e) {
    logger.error('활동 통계를 불러오는 중에 오류가 발생했습니다.', { ip: ip, url: 'requestStat', query: '-', result: e.toString()});
  }
});

app.post('//requestStatistics', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  try {
    let namelist = await db.query("SELECT * FROM `namelist_" + await settings('currentSemister') + "`;");
    let data = [];
    
    if(req.body.type == 'thisMonthFeeding') {
      let verify = await db.query("SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='" + dateformat(new Date(), 'yyyymm') + "';");
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
    }
    else if(req.body.type == 'lastMonthFeeding') {
      let date = new Date();
      date.setMonth(date.getMonth() - 1);
      let verify = await db.query("SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='" + dateformat(date, 'yyyymm') + "';");
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
    }
    else if(req.body.type == 'thisMonthTotal') {
      let verify = await db.query("SELECT * FROM verify WHERE REPLACE(SUBSTRING_INDEX(date, '-', 2), '-', '')='" + dateformat(new Date(), 'yyyymm') + "';");
      for(let obj of verify) {
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
    else if(req.body.type == 'totalStatistics') {
      let verify = await db.query("SELECT * FROM verify;");
      for(let obj of verify) {
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
    else {
      if(req.body.type) {
        let [start, end] = req.body.type.split('|');
        let verify = await db.query("SELECT * FROM verify WHERE date BETWEEN '" + start + "' AND '" + end + "';");
        for(let obj of verify) {
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
    }
    res.send(data);
    //logger.info('활동 통계를 불러옵니다.', { ip: ip, url: 'requestStatistics', query: '-', result: JSON.stringify(data)});
  }
  catch(e) {
    console.log(e)
    logger.error('활동 통계를 불러오는 중에 오류가 발생했습니다.', { ip: ip, url: 'requestStatistics', query: '-', result: e.toString()});
  }
});

app.post('//requestUserStat', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = 'SELECT date, course, score FROM verify WHERE id=' + req.body.id + ' ORDER BY date DESC;';
    result = await db.query(query);
    res.send(result);
    //logger.info('회원의 활동 기록을 불러옵니다.', { ip: ip, url: 'requestUserStat', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result) });
  }
  catch(e) {
    logger.error('회원의 활동 기록을 불러오는 중에 오류가 발생했습니다.', { ip: ip, url: 'requestUserStat', query: query ? query : 'Query String Not generated.', result: e.toString() });
  }
});

app.post('//requestUserDetail', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let semister, query, result;
  try {
    if(req.body.semister == 'this') semister = await settings('currentSemister');
    else if(req.body.semister == 'past') {
      let tmp = await settings('currentSemister');
      tmp = tmp.split('-');
      if(tmp[1] == '2') semister = tmp[0] + '-1';
      else semister = (Number(tmp[0]) - 1) + '-2';
    }
    else semister = req.body.semister;

    query = 'SELECT * FROM `namelist_' + semister + '` WHERE `ID`=' + req.body.ID + ';';
    result = await db.query(query);
    res.send(result);
  }
  catch(e) {
    logger.error('회원 정보를 불러오는 중에 오류가 발생했습니다.', { ip: ip, url: 'requestUserDetail', query: query ? query : 'Query String Not generated.', result: e.toString() });
  }
});

app.post('//getMemberIdByName', async function(req, res) {
  try {
    let semister = await settings('currentSemister');
    let result = await db.query("SELECT `ID` FROM `namelist_" + semister + "` WHERE `name`='" + req.body.name + "';");
    if(result.length == 1) res.send(result);
    else if(!result.length) res.send([{ ID: 0 }]);
    else if(result.length > 1) res.send([{ ID: -1 }]);
  }
  catch(e) { console.error(e); }
});
  

app.post('//mapLoad', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  logger.info('Google Maps Javascript API map rendering call', { ip: ip, url: 'mapLoad', query: '-', result: 'ID: ' + (req.session.ID ? req.session.ID : 'ANONYMOUS') });
});
  
app.listen(5710, async function() {
  db = await pool.getConnection();
  console.log('Server startup at ' + new Date() + '\nServer is listening on port 5710');
  logger.info('Server Startup.', { ip: 'LOCALHOST', url: 'SERVER', query: '-', result: 'Server listening on port 5710'});
  setInterval(async function() {
    try {
      let query = 'SHOW TABLES;';
      let result = await db.query(query);
      //logger.info('DB connection check.', { ip: 'LOCALHOST', url: 'SERVER', query: query ? query : 'Query String Not generated.', result: JSON.stringify(result) });
    }
    catch(e) {
      /*
      logger.info('DB connection closed. Attempting Restart', { ip: 'LOCALHOST', url: 'SERVER', query: 'SIGRESTART', result: '-' });
      let cmd = '/usr/local/bin/node /home/luftaquila/HDD/ajoumeow/server/server.js';
      let exec = require('child_process').exec;
      exec(cmd, function() {
        process.kill();
      });
      */
      
      db = await pool.getConnection();
      logger.info('DB connection closed. Attempting reconnect.', { ip: 'LOCALHOST', url: 'SERVER', query: 'pool.getConnection()', result: JSON.stringify(db) });
    }
  }, 300000);
    
});

async function kakaoClient() {
  console.log('Login successful. Main client is in startup.');
  
  client.on('message', async chat => {
    
    if(chat.channel.id == process.env.verifyChannelId) { //284687032997214
      chat.markChatRead(); // Read incoming chat
      // Only handle message with keywords
      if(chat.text.includes('인증') && chat.text.includes('코스') && ((chat.text.includes('월') && chat.text.includes('일')) || chat.text.includes('/'))) {
        // Recognizable datestring: m월d일, m월 d일, m/d
        let targetDate = chat.text.match(/\b(\d+)\/(\d+)\b/) || chat.text.match(/(\d+)월 (\d+)일/) || chat.text.match(/(\d+)월(\d+)일/);
        if(targetDate) { // if date detected
          let targetMonth = targetDate[1];
          let targetDay = targetDate[2];
          let currentYear = new Date().getFullYear();
          let current = new Date();
          const dateList = [new Date(currentYear, Number(targetMonth) - 1, Number(targetDay)), new Date(Number(currentYear) - 1, Number(targetMonth) - 1, Number(targetDay)), new Date(Number(currentYear) + 1, Number(targetMonth) - 1, Number(targetDay))]
          dateList.sort((a, b) => { return Math.abs(current - a) - Math.abs(current - b); });
          targetDate = dateList[0]; // get nearest target date

          // detect target courses and members
          let targetCourses = chat.text.match(/\b(?=\w*[코스])\w+\b/g);
          let targetMembers = chat.text.match(/(?<![가-힣])[가-힣]{3}(?![가-힣])/g);
          if(targetCourses && targetMembers) { // if courses and members detected

            // Score table
            let score = { weekday: { solo: 1.5, dual: 1}, weekend: { solo: 2, dual: 1.5} }
            
            // Detect target date is weekand and number of people
            let isWeekEnd = targetDate.getDayNum() > 5 ? 'weekend' : 'weekday';
            let isSolo = targetMembers.length == 1 ? 'solo' : 'dual';

            for(let i in targetMembers) { // get member student id with name
              let res = await postRequest('https://luftaquila.io/ajoumeow/api/getMemberIdByName', { name: targetMembers[i] });
              let id = JSON.parse(res)[0].ID;
              if(id > 0) targetMembers[i] = { name: targetMembers[i], id: JSON.parse(res)[0].ID };
              else if(!id) return chat.channel.sendText(targetMembers[i] + ' 회원님 사이트에 회원등록되지 않아 인증이 불가능합니다.\nC: ERR_NO_ENTRY_DETECTED');
              else if(id < 0) return chat.channel.sendText(targetMembers[i] + ' 회원님 동명이인이 존재하여 자동 인증이 불가능합니다.\nC: ERR_MULTIPLE_ENTRY_DETECTED');
            }

            // writing payload
            let payload = [];
            for(let course of targetCourses) { 
              for(let member of targetMembers) {
                payload.push({
                  ID: member.id, name: member.name,
                  date: dateformat(targetDate, 'yyyy-mm-dd'), course: course + '코스',
                  score: score[isWeekEnd][isSolo]
                });
              }
            }
            
            // send verify data to ajoumeow server
            let res = await postRequest('https://luftaquila.io/ajoumeow/api/verify', { data: JSON.stringify(payload) });
            if(JSON.parse(res).result == true) {
              
              let resultString = greetings();
              
              resultString += payload[0].date + '일자 급식 확인되었습니다!';
              for(let obj of payload) resultString += '\n' + obj.name + ' 회원님 ' + obj.course + ' ' + obj.score + '점';
              chat.channel.sendText(resultString);
            }
          }
        }
      }
    }
  });
  
  client.on('user_join', async (channel, user) => {
    let info = channel.getUserInfo(user);
    if(!info) return;
    
    let channelName = channel.Name, channelId = channel.Id;
    let userName = info.Nickname, userId = info.Id;
    
    if(userId == process.env.myUserId) {
      // if myself invited to chatroom, update channelId
      if(channelName.includes('미유미유') && channelName.includes('인증')) {
        process.env.verifyChannelId = channelId;
        
        let envFile = envfile.parse(fs.readFileSync('./.env'));
        envFile.verifyChannelId = channelId;
        fs.writeFileSync('./.env', envfile.stringify(envFile));
      }
        
      else if(channelName.includes('미유미유') && channelName.includes('공지')) {
        process.env.noticeChannelId = channelId;
        
        let envFile = envfile.parse(fs.readFileSync('./.env'));
        envFile.noticeChannelId = channelId;
        fs.writeFileSync('./.env', envfile.stringify(envFile));
      }
        
      else if(channelName.includes('미유미유') && channelName.includes('단톡')) {
        process.env.talkChannelId = channelId;
        
        let envFile = envfile.parse(fs.readFileSync('./.env'));
        envFile.talkChannelId = channel
        fs.writeFileSync('./.env', envfile.stringify(envFile));
      }
    }
    
    else { // if others invited to chatroom
      // send greeting or notices
      if(channelId == process.env.verifyChannelId) {
        channel.sendText('미유미유 급식 인증방입니다! 급식 인증 외 채팅은 자제해 주세요!');
      }
        
      else if(channelId == process.env.noticeChannelId) {
        
      }
        
      else if(channelId == process.env.talkChannelId) {
        channel.sendText('안녕하세요! 미유미유 단톡방입니다!!');
      }
    }
  });
  
  async function postRequest(url, data) {
    return new Promise(function(resolve, reject) {
      request.post({
        url: url,
        form: data,
      }, function(err, resp, body) {
        if (err) reject(err);
        else resolve(body);
      });
    });
  }
  
  function greetings() {
    /*
    // 주말일 때
    // 날씨가 추울 때
    // 그냥
    let weekend = ['주말에 수고하셨어요!'];
    let coldweather = ['추운 날씨에 고생하셨어요!'];
    let normal = ['수고하셨습니다!'];
    let target = cold ? coldweather : (new Date().isWeekend ? weekend : normal);
    let greet = target[Math.floor(Math.random() * target.length)];
    */
    return '';
  }
}


async function settings(name) {
  let res = await db.query(`SELECT name, value FROM settings WHERE name='` + name + `';`);
  return res[0].value;
}

function log(ip, identity, type, description, query, result) {
  try {
    query = query.replace(/"/g, "'").replace(/`/g, "'").replace(/'/g, '');
    result = JSON.stringify(result).replace(/"/g, "'").replace(/`/g, "'").replace(/'/g, "");
    db.query("DELETE FROM log WHERE timestamp < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))");
    db.query("INSERT INTO log(ip, identity, type, query, description, result) VALUES('" + ip + "', '" + identity + "', '" + type + "', '" + query + "', '" + description + "', '" + result + "');");
  }
  catch(e) {
    let error = JSON.stringify(e).replace(/"/g, "'").replace(/`/g, "'").replace(/'/g, "");
    db.query("INSERT INTO log(ip, identity, type, query, description, result) VALUES('-', '-', '" + type + "', 'Logging Error', 'Logging Error', '" + error + "');"); }
}
  
  