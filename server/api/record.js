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

export default router
/*

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
  let result;
  try {
    if(await settings('isApply') == 'TRUE') {
      if(await settings('isApplyRestricted') == 'TRUE') {
        let applyTerm = await settings('applyTerm');
        applyTerm = applyTerm.split('~');
        if((new Date() > new Date(applyTerm[0]) && new Date() < new Date(new Date(applyTerm[1]).getTime() + 60 * 60 * 24 * 1000))) {
          result = { 'result' : true, 'semister' : await settings('currentSemister') }        
        }
        else result = { result: null };
      }
      else {
        result = { 'result' : true, 'semister' : await settings('currentSemister') }        
      }
    }
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
  let result;
  try {
    if(await settings('isRegister') == 'TRUE') {
      if(await settings('isRegisterRestricted') == 'TRUE') {
        let registerTerm = await settings('registerTerm');
        registerTerm = registerTerm.split('~');
        if((new Date() > new Date(registerTerm[0]) && new Date() < new Date(new Date(registerTerm[1]).getTime() + 60 * 60 * 24 * 1000))) {
          result = { 'result' : true, 'semister' : await settings('currentSemister') }        
        }
        else result = { result: null };
      }
      else {
        result = { 'result' : true, 'semister' : await settings('currentSemister') }        
      }
    }
    else result = { result: null };
    
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
  try {
    if(req.body.editParam == 'currentSemister') {
      const target = client.channelManager.map.get(process.env.noticeChannelId);
      await target.sendText('시스템 현재 학기가 변경되었습니다!\n\n 기존 회원 분들은 사이트의 회원 등록 - 기존 회원 메뉴를 통해 새 학기 명단에 다시 등록해 주세요. 새 학기에도 화이팅!');
    }
  }
  catch(e) { }
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
  


*/