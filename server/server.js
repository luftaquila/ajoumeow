const fs = require('fs');
const ejs = require('ejs');
const request = require('request');
const express = require('express');
const mariadb = require('mariadb');
const dateformat = require('dateformat');
const bodyParser = require('body-parser');
const session = require('express-session');
const sessionDatabase = require('express-mysql-session')(session);
const DBOptions = {
  host: 'localhost', 
  user:'root', 
  password: 'luftaquila',
  database: 'ajoumeow'
};
const pool = mariadb.createPool(DBOptions);
const sessionDB = new sessionDatabase(DBOptions);
let db;

const app = express();
//app.use('/', express.static('../'));
app.set("view engine", "ejs");
app.set('views', 'views');
app.engine('html', ejs.renderFile);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
 secret: '@+*LU_Ft%AQuI-|!la#@$',
 resave: false,
 saveUninitialized: true,
 store: sessionDB
}));

app.get('/', async function(req, res) {
  console.log(new Date(), 'start')
  let record = await db.query("SELECT * FROM record;")
  let namelist = await db.query("SELECT * FROM `namelist_20-1`;");
  res.status(200)
  for(let obj of record) {
    let target = namelist.find(o => o.name == obj.name);
    if(target) await db.query("UPDATE record SET ID=" + target.ID + " WHERE name='" + obj.name + "';");
  }
  console.log(new Date(), 'ok')
});

app.post('//loginCheck', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    if(req.session.isLogin) {
      query = 'SELECT name, ID, role FROM `namelist_' + await settings('currentSemister') + "` WHERE ID='" + req.session.ID + "';";
      result = await db.query(query);
      res.send({ 'name' : result[0].name, 'id' : result[0].ID, 'role' : result[0].role });
      log(ip, result[0].ID, 'loginCheck', '요청 세션이 로그인된 세션인지 확인합니다.', query, { result : 'success' });
    }
    else {
      res.send({ 'name' : null, 'id' : null, 'role' : null });
      log(ip, null, 'loginCheck', '요청 세션이 로그인된 세션인지 확인합니다.', query, { result : 'success' });
    }
  }
  catch(e) { log(ip, null, 'loginCheck', '요청 세션이 로그인된 세션인지 확인합니다.', query, e.code); }
});

app.post('//login', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = 'SELECT name, ID, role FROM `namelist_' + await settings('currentSemister') + "` WHERE ID='" + req.body['ID'] + "';";
    result = await db.query(query);
    if(result[0]) {
      req.session.ID = req.body['ID'];
      req.session.isLogin = true;
      res.send({ 'name' : result[0].name, 'id' : result[0].ID, 'role' : result[0].role });
      log(ip, result[0].ID, 'login', '로그인', query, { result : 'success' });
    }
    else {
      res.send({ 'name' : null, 'id' : null, 'role' : null });
      log(ip, null, 'login', '로그인 실패', query, { result : 'success' });
    } 
  }
  catch(e) { log(ip, null, 'login', '로그인 시도', query, e.code); }
});

app.post('//logout', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  log(ip, req.session.ID, 'logout', '로그아웃', 'req.session.destroy()', { result : 'success' });
  req.session.destroy();
  res.send({ 'result' : 'success' });
});

app.post('//apply', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = 'INSERT INTO `namelist_' + await settings('currentSemister') + '`(college, department, ID, name, phone, birthday, 1365ID, register)' +
        " VALUES('" + req.body['단과대학'] + "', '" + req.body['학과'] + "', '" + req.body['학번'] + "', '" + req.body['이름'] + "', '" + req.body['전화번호'] + "', '" + req.body['생년월일'] + "', '" + req.body['1365 아이디'] + "', '" + req.body['가입 학기'] + "');";
    result = await db.query(query);
    res.send(result);
    log(ip, null, 'apply', '회원 등록', query, result);
  }
  catch(e) {
    res.send({ 'result' : null, 'error' : e });
    log(ip, null, 'apply', '회원 등록', query, e.code);
  }
});

app.post('//requestApply', async function(req, res) {
  let applyTerm = await settings('applyTerm');
  applyTerm = applyTerm.split('~');
  if((new Date() > new Date(applyTerm[0]) && new Date() < new Date(new Date(applyTerm[1]).getTime() + 60 * 60 * 24 * 1000)) || (await settings('isAllowAdditionalApply') == 'TRUE'))
    res.send({ 'result' : true });
  else res.send({ 'result' : null });
});

app.post('//requestRegister', async function(req, res) {
  let registerTerm = await settings('registerTerm');
  registerTerm = registerTerm.split('~');
  if((new Date() > new Date(registerTerm[0]) && new Date() < new Date(new Date(registerTerm[1]).getTime() + 60 * 60 * 24 * 1000)) || (await settings('isAllowAdditionalRegister') == 'TRUE'))
    await res.send({ 'result' : true, 'semister' : await settings('currentSemister') });
  else res.send({ 'result' : null });
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
      result = await db.query(query);
    }
    else {
      query = "UPDATE settings SET value='" + req.body.editData + "' WHERE name='" + req.body.editParam + "';";
      result = await db.query(query);
    }
    res.send({ 'result' : true });
    log(ip, req.session.ID, 'modifySettings', '설정값 변경', query, result);
  }
  catch(e) { 
    res.send({ 'result' : null, 'error' : e });
    log(ip, req.session.ID, 'modifySettings', '설정값 변경', query, e.code);
  }
});

app.post('//records', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = "SELECT * FROM record WHERE date BETWEEN '" + req.body.startDate + "' AND '" + req.body.endDate + "' ORDER BY date, course, timestamp;";
    result = await db.query(query);
    res.send(result);
    log(ip, null, 'records', '급식표 데이터 요청', query, { result : 'success' });
  }
  catch(e) {
    log(ip, null, 'records', '급식표 데이터 요청', query, e.code);
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
    log(ip, req.session.ID, 'requestSettings', '설정값 요청', query, { result : 'success' });
  }
  catch(e) {
    log(ip, req.session.ID, 'requestSettings', '설정값 요청', query, e.code);
  }
});

app.post('//requestNameList', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let semister, query, result;
  try {
    if(req.body.semister == 'this') semister = await settings('currentSemister');
    else if(req.body.semister == 'past') {
      let tmp = await settings('currentSemister').split('-');
      if(tmp[1] == '2') semister = tmp[0] + '-1';
      else semister = (Number(tmp[0]) - 1) + '-2';
    }
    else semister = req.body.semister;
    query = 'SELECT * FROM `namelist_' + semister + '`;';
    result = await db.query(query);
    res.send(result);
    log(ip, null, 'requestNamelist', '회원 명단 요청', query, { result : 'success' });
  }
  catch(e) {
    log(ip, null, 'requestNamelist', '회원 명단 요청', query, e.code);
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
    log(ip, null, 'isAllowedAdminConsole', '관리자 권한 요청', query, { result : 'success' });
  }
  catch(e) {
    res.send({ 'result' : null, 'error' : e });
    log(ip, null, 'isAllowedAdminConsole', '관리자 권한 요청', query, e.code);
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
    log(ip, req.session.ID, 'modifyMember', '회원 정보 수정', query, result);
  }
  catch(e) {
    res.send({ 'result' : null, 'error' : e });
    log(ip, req.session.ID, 'modifyMember', '회원 정보 수정', query, e.code);
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
      log(ip, req.session.ID, 'insertIntoTable', '급식 중복 신청', query, 'ER_DUP_RECORD');
      return res.status(406).send({ 'result' : null, 'error' : { 'code' : 'DUP_RECORD' } }); 
    }
    query = "INSERT INTO record(ID, name, date, course) VALUES(" + payload.ID + ", '" + payload.name + "', '" + payload.date + "', '" + payload.course + "');";
    result = await db.query(query);
    res.send({ 'result' : true });
    log(ip, req.session.ID, 'insertIntoTable', '급식 신청', query, result);
  }
  catch(e) {
    res.status(406).send({ 'result' : null, 'error' : e });
    log(ip, req.session.ID, 'insertIntoTable', '급식 신청', query, e.code);
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
    log(ip, req.session.ID, 'deleteFromTable', '급식 신청 삭제', query, result);
  }
  catch(e) {
    res.send({ 'result' : null, 'error' : e });
    log(ip, req.session.ID, 'deleteFromTable', '급식 신청 삭제', query, e.code);
  }
});

app.post('//requestVerifyList', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  try {
    let record = await db.query("SELECT * FROM record WHERE date='" + req.body.date + "' ORDER BY course;");
    let verify = await db.query("SELECT * FROM verify WHERE date='" + req.body.date + "' ORDER BY course;");
    res.send({ 'record' : record, 'verify' : verify });
    log(ip, req.session.ID, 'requestVerifyList', '급식 인증 기록 요청', '-', { result : 'success' });
  }
  catch(e) {
    log(ip, req.session.ID, 'requestVerifyList', '급식 인증 기록 요청', '-', e.code);
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
      log(ip, req.session.ID, 'verify', '급식 인증', query, result);
    }
    res.send({ 'result' : true });
  }
  catch(e) {
    res.status(406).send({ 'error' : e });
    log(ip, req.session.ID, 'verify', '급식 인증', query, e.code);
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
      log(ip, req.session.ID, 'deleteVerify', '급식 인증 삭제', query, result);
    }
    res.send({ 'result' : true });
  }
  catch(e) {
    res.status(406).send({ 'error' : e });
    log(ip, req.session.ID, 'deleteVerify', '급식 인증 삭제', query, e.code);
  }
});

app.post('//requestLatestVerify', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    query = "SELECT * FROM verify ORDER BY date DESC LIMIT 1;";
    result = await db.query(query);
    res.send(result);
    log(ip, req.session.ID, 'requestLatestVerify', '마지막 급식 인증 날짜 요청', query, { result: 'success' });
  }
  catch(e) {
    log(ip, req.session.ID, 'requestLatestVerify', '마지막 급식 인증 날짜 요청', query, e.code);
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
    log(ip, req.session.ID, 'requestNamelistTables', '회원 명단 테이블 리스트 요청', query, { result: 'success' });
  }
  catch(e) {
    log(ip, req.session.ID, 'requestNamelistTables', '회원 명단 테이블 리스트 요청', query, e.code);
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
  log(ip, req.session.ID, 'request1365', '1365 인증서 생성', null, { result : 'success' });
  }
  catch(e) {}
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
    log(ip, null, 'requestNotice', '공지사항 내용 요청', query, { result : 'success' });
  }
  catch(e) {
    log(ip, null, 'requestNotice', '공지사항 내용 요청', query, e.code);
  }
});

app.post('//requestLogs', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let query, result;
  try {
    if(req.body.error == 'true') query = "SELECT * FROM log WHERE result LIKE '%error%' AND type REGEXP('" + req.body.type + "');";
    else query = "SELECT * FROM log WHERE type REGEXP('" + req.body.type + "');";
    result = await db.query(query);
    for(let obj of result) obj.timestamp = dateformat(obj.timestamp, 'yyyy-mm-dd HH:MM:ss');
    res.send(result);
  }
  catch(e) {
    console.log(e)
  }
});

app.listen(5710, async function() {
  db = await pool.getConnection();
  console.log('Server startup at ' + new Date() + '\nServer is listening on port 5710');
  db.query("INSERT INTO log(ip, identity, type, query, description, result) VALUES('LOCALHOST', 'SERVER', 'server', 'Server startup', 'Server startup', 'Listening on port 5710');");
});

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
  catch(e) {}
}
  
  