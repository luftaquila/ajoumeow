import jwt from 'jsonwebtoken';
import prettify from 'pretty-format';
import { eq, and } from 'drizzle-orm';

import { Response, Log } from './interface.js';
import { db, sqlite } from '../../db/index.js';
import { members, semesters, semesterMembers, settings, logs } from '../../db/schema.js';

let util = {};

util.isLogin = async function(request, reply) {
  const token = request.headers['x-access-token'];
  if (!token) {
    util.logger(new Log('info', 'util', 'util.isLogin', '로그인 확인', 'internal', 400, token, 'ERR_NO_TOKEN'));
    reply.code(400).send(new Response('error', '로그인 상태가 아닙니다.', 'ERR_NO_TOKEN'));
    return reply;
  }
  try {
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });
    request.decoded = decoded;
    util.logger(new Log('info', 'util', 'util.isLogin', '로그인 확인', 'internal', 0, token, request.decoded));
  } catch (err) {
    util.logger(new Log('info', 'util', 'util.isLogin', '로그인 확인', 'internal', 401, token, 'ERR_INVALID_TOKEN'));
    reply.code(401).send(new Response('error', '로그인이 만료되었습니다.<br>다시 로그인해 주세요.', 'ERR_INVALID_TOKEN'));
    return reply;
  }
};

util.isAdmin = async function(request, reply) {
  const token = request.headers['x-access-token'];
  if (!token) {
    util.logger(new Log('info', 'util', 'util.isAdmin', '관리자 확인', 'internal', 400, token, 'ERR_NO_TOKEN'));
    reply.code(400).send(new Response('error', '로그인 상태가 아닙니다.', 'ERR_NO_TOKEN'));
    return reply;
  }
  try {
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });
    if (decoded.role == '회원') {
      util.logger(new Log('info', 'util', 'util.isAdmin', '관리자 확인', 'internal', 403, token, 'ERR_USER_NOT_ADMIN'));
      reply.code(403).send(new Response('error', '관리자가 아닙니다.', 'ERR_USER_NOT_ADMIN'));
      return reply;
    }
    request.decoded = decoded;
    util.logger(new Log('info', 'util', 'util.isAdmin', '관리자 확인', 'internal', 0, token, request.decoded));
  } catch (err) {
    util.logger(new Log('info', 'util', 'util.isAdmin', '관리자 확인', 'internal', 401, token, 'ERR_INVALID_TOKEN'));
    reply.code(401).send(new Response('error', '로그인이 만료되었습니다.<br>다시 로그인해 주세요.', 'ERR_INVALID_TOKEN'));
    return reply;
  }
};

util.getSettings = function(name) {
  const row = db.select({ value: settings.value }).from(settings).where(eq(settings.key, name)).get();
  return row ? row.value : null;
};

util.getCurrentSemester = function() {
  const semesterName = util.getSettings('currentSemister');
  if (!semesterName) return null;
  return db.select().from(semesters).where(eq(semesters.name, semesterName)).get();
};

util.getMemberByStudentId = function(studentId) {
  return db.select().from(members).where(eq(members.studentId, String(studentId))).get();
};

const logStmt = sqlite.prepare(
  `INSERT INTO logs (level, ip, endpoint, description, method, status, query, result) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);

util.logger = function(log) {
  try {
    log = logValidator(log);
    logStmt.run(log.level, log.IP, log.endpoint, log.description, log.method, log.status, log.query, log.result);
  }
  catch(e) { console.log(e); }
};

function logValidator(log) {
  for(let prop of Object.getOwnPropertyNames(log)) {
    if(typeof(log[prop]) == 'object') {
      log[prop] = prettify(log[prop], { min: true });
      if(log[prop].length > 300) log[prop] = log[prop].substr(0, 300) + '...';
    }
  }
  return log;
}

export default util;
