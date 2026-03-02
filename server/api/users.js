import util from '../controllers/util/util.js';
import { Response, Log } from '../controllers/util/interface.js';

export default async function(fastify, opts) {

  // Get namelist table by semister
  fastify.get('/list', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      if(request.query.semister == 'all') {
        let result = await util.query(`SHOW TABLES LIKE '%namelist_%';`);
        let map = result.map(x => x['Tables_in_ajoumeow (%namelist_%)']);
        util.logger(new Log('info', request.remoteIP, request.originalPath, '명단 목록 요청', request.method, 200, request.query, map));
        return reply.code(200).send(new Response('success', null, map));
      }
      else {
        let result = await util.query(`SELECT * FROM \`namelist_${request.query.semister}\`;`);
        util.logger(new Log('info', request.remoteIP, request.originalPath, '명단 요청', request.method, 200, request.query, result));
        return reply.code(200).send(new Response('success', null, result));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '명단 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  // Get users info by name
  fastify.get('/name', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      let result = await util.query(`SELECT name, ID FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE name LIKE '%${request.query.query}%';`);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '사용자 정보 요청', request.method, 200, request.query, result));
      return reply.code(200).send(new Response('success', null, result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '사용자 정보 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  // Add new user
  fastify.post('/id', async (request, reply) => {
    try {
      let namelists = await util.query(`SHOW TABLES LIKE '%namelist_%';`);
      namelists = namelists.map(x => x['Tables_in_ajoumeow (%namelist_%)']).reverse();
      let currentNamelist = namelists[namelists.indexOf(`namelist_${await util.getSettings('currentSemister')}`)];

      // check if duplicates
      if(currentNamelist) {
        const test = await util.query(`SELECT ID FROM \`${currentNamelist}\` WHERE ID=${request.body['학번']};`);
        if(test.length) {
          util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 등록', request.method, 400, request.body, 'ERR_ALREADY_REGISTERED'));
          return reply.code(400).send(new Response('error', '이미 이번 학기 회원으로 등록되셨습니다.', 'ERR_ALREADY_REGISTERED'));
        }
      }

      // test if user is previously registered
      let previous = false;
      for(let namelist of namelists) {
        const test = await util.query(`SELECT * FROM \`${namelist}\` WHERE ID=${request.body['학번']};`);
        if(test.length) {
          previous = test[0];
          break;
        }
      }

      // check if user lookuped for previously registered
      if(request.body.lookup) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '기존 회원 등록여부 조회', request.method, 200, request.body, previous));
        if(previous) return reply.code(200).send(new Response('success', null, previous));
        else return reply.code(400).send(new Response('error', '기존 회원이 아닙니다.<br>신입 회원으로 등록해 주세요.', 'ERR_NEVER_REGISTERED'));
      }

      if(request.body.new == 'true' && previous) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 등록', request.method, 400, request.body, 'ERR_REGISTERED_BEFORE'));
        return reply.code(400).send(new Response('error', '지난 학기에 가입한 적이 있습니다.<br>기존 회원으로 등록해 주세요.', 'ERR_REGISTERED_BEFORE'));
      }
      else if(request.body.new == 'false' && !previous) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 등록', request.method, 400, request.body, 'ERR_NEVER_REGISTERED'));
        return reply.code(400).send(new Response('error', '기존 회원이 아닙니다.<br>신입 회원으로 등록해 주세요.', 'ERR_NEVER_REGISTERED'));
      }

      /* proceeding apply */
      // create table if current semister's namelist not exists
      if(!currentNamelist) {
        await util.query("CREATE TABLE `namelist_" + await util.getSettings('currentSemister') + "` (" +
              "`college` varchar(10) not null," +
              "`department` varchar(15) not null," +
              "`ID` int(11) not null," +
              "`name` varchar(30) not null," +
              "`phone` varchar(15) not null," +
              "`birthday` varchar(10)," +
              "`1365ID` varchar(30)," +
              "`register` varchar(20)," +
              "`role` varchar(10) default '회원'," +
              "PRIMARY KEY (`ID`)" +
              ") ENGINE=InnoDB DEFAULT CHARSET=utf8;");
      }
      let result = await util.query(`INSERT INTO \`namelist_${await util.getSettings('currentSemister')}\`(college, department, ID, name, phone, birthday, 1365ID, register, role) VALUES('${request.body['단과대학']}', '${request.body['학과']}', ${request.body['학번']}, '${request.body['이름']}', '${request.body['전화번호']}', '${request.body['생년월일']}', '${request.body['1365 아이디']}', '${request.body['가입 학기']}', '${request.body['직책']}');`);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 등록', request.method, 201, request.body, result));
      return reply.code(201).send(new Response('success', null, result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '회원 등록 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  // Modify user info by id
  fastify.put('/id', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      let result = await util.query(`UPDATE \`namelist_${await util.getSettings('currentSemister')}\` SET college='${request.body.college}', department='${request.body.department}', name='${request.body.name}', phone='${request.body.phone}', birthday='${request.body.birthday}', 1365ID='${request.body['1365ID']}', role='${request.body.role}', register='${request.body.register}' WHERE ID=${request.body.ID};`);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 정보 수정', request.method, 200, request.body, result));
      return reply.code(200).send(new Response('success', null, result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '회원 정보 수정 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  // Delete user by id
  fastify.delete('/id', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      if(!request.body.ID) request.body.ID = 0;
      let result = await util.query(`DELETE FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE ID=${request.body.ID}`);
      if(result.affectedRows) {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 삭제', request.method, 200, request.body, result));
        return reply.code(200).send(new Response('success', null, result));
      }
      else {
        util.logger(new Log('info', request.remoteIP, request.originalPath, '회원 삭제', request.method, 400, request.body, 'ERR_NO_MATCHING_ID'));
        return reply.code(400).send(new Response('error', 'No matching ID', 'ERR_NO_MATCHING_ID'));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '회원 삭제 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  // Get register table by semister
  fastify.get('/register', { preHandler: [util.isAdmin] }, async (request, reply) => {
    try {
      if(request.query.semister == 'all') {
        let result = await util.query(`SHOW TABLES LIKE '%register_%';`);
        let map = result.map(x => x['Tables_in_ajoumeow (%register_%)']);
        util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청자 명단 목록 요청', request.method, 200, request.query, map));
        return reply.code(200).send(new Response('success', null, map));
      }
      else {
        let result = await util.query(`SELECT * FROM \`register_${request.query.semister}\` ORDER BY timestamp DESC;`);
        util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청자 명단 요청', request.method, 200, request.query, result));
        return reply.code(200).send(new Response('success', null, result));
      }
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '가입 신청자 명단 요청 오류', request.method, 500, request.query, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });

  // register user
  fastify.post('/register', async (request, reply) => {
    try {
      // check if registered again
      let registers = await util.query(`SHOW TABLES LIKE '%register_%';`);
      registers = registers.map(x => x['Tables_in_ajoumeow (%register_%)']).reverse();

      let currentRegister = null;
      if(registers.indexOf(`register_${await util.getSettings('currentSemister')}`) != -1)
        currentRegister = registers.splice(registers.indexOf(`register_${await util.getSettings('currentSemister')}`), 1);

      if(currentRegister) {
        const test = await util.query(`SELECT ID FROM \`${currentRegister}\` WHERE ID=${request.body['학번']};`);
        if(test.length) {
          util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청', request.method, 400, request.body, 'ERR_ALREADY_REGISTERED'));
          return reply.code(400).send(new Response('error', '이미 가입 신청하셨습니다!<br>조금만 기다리시면 임원진이 연락을 드릴 거에요.', 'ERR_ALREADY_REGISTERED'));
        }
      }

      /* proceeding register */
      // create table if current semister's register table not exists
      if(!currentRegister) {
        await util.query("CREATE TABLE `register_" + await util.getSettings('currentSemister') + "` (" +
              "`timestamp` timestamp," +
              "`ID` int(11) not null," +
              "`name` varchar(30) not null," +
              "`college` varchar(10) not null," +
              "`department` varchar(15) not null," +
              "`phone` varchar(15) not null," +
              "PRIMARY KEY (`ID`)" +
              ") ENGINE=InnoDB DEFAULT CHARSET=utf8;");
      }
      let result = await util.query(`INSERT INTO \`register_${await util.getSettings('currentSemister')}\`(ID, name, college, department, phone) VALUES(${request.body['학번']}, '${request.body['이름']}', '${request.body['단과대학']}', '${request.body['학과']}', '${request.body['연락처']}');`);
      util.logger(new Log('info', request.remoteIP, request.originalPath, '가입 신청', request.method, 201, request.body, result));
      return reply.code(201).send(new Response('success', null, result));
    }
    catch(e) {
      util.logger(new Log('error', request.remoteIP, request.originalPath, '가입 신청 오류', request.method, 500, request.body, e.stack));
      return reply.code(500).send(new Response('error', '알 수 없는 오류입니다.', 'ERR_UNKNOWN'));
    }
  });
}
