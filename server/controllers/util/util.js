import jwt from 'jsonwebtoken';
import { eq, and } from 'drizzle-orm';

import { Log, error } from './interface.js';
import { db } from '../../db/index.js';
import { members, semesters, semesterMembers, settings } from '../../db/schema.js';

let util = {};

util.extractToken = function(request) {
  const auth = request.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
};

util.isLogin = async function(request, reply) {
  const token = util.extractToken(request);
  if (!token) {
    util.logger(new Log('info', 'util', 'util.isLogin', '로그인 확인', 'internal', 400, token, 'ERR_NO_TOKEN'));
    reply.code(400).send(error('ERR_NO_TOKEN', '로그인 상태가 아닙니다.'));
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
    reply.code(401).send(error('ERR_INVALID_TOKEN', '로그인이 만료되었습니다. 다시 로그인해 주세요.'));
    return reply;
  }
};

util.isAdmin = async function(request, reply) {
  const token = util.extractToken(request);
  if (!token) {
    util.logger(new Log('info', 'util', 'util.isAdmin', '관리자 확인', 'internal', 400, token, 'ERR_NO_TOKEN'));
    reply.code(400).send(error('ERR_NO_TOKEN', '로그인 상태가 아닙니다.'));
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
      reply.code(403).send(error('ERR_USER_NOT_ADMIN', '관리자가 아닙니다.'));
      return reply;
    }
    request.decoded = decoded;
    util.logger(new Log('info', 'util', 'util.isAdmin', '관리자 확인', 'internal', 0, token, request.decoded));
  } catch (err) {
    util.logger(new Log('info', 'util', 'util.isAdmin', '관리자 확인', 'internal', 401, token, 'ERR_INVALID_TOKEN'));
    reply.code(401).send(error('ERR_INVALID_TOKEN', '로그인이 만료되었습니다. 다시 로그인해 주세요.'));
    return reply;
  }
};

util.optionalAuth = async function(request, reply) {
  const token = util.extractToken(request);
  if (!token) {
    request.decoded = null;
    return;
  }
  try {
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });
    request.decoded = decoded;
  } catch (err) {
    request.decoded = null;
  }
};

util.resolveMemberId = function(decoded) {
  if (!decoded) return null;
  if (decoded.memberId) return decoded.memberId;
  const member = util.getMemberByStudentId(decoded.id);
  return member ? member.id : null;
};

util.getSettings = function(name) {
  const row = db.select({ value: settings.value }).from(settings).where(eq(settings.key, name)).get();
  return row ? row.value : null;
};

util.getCurrentSemester = function() {
  const semesterName = util.getSettings('currentSemester');
  if (!semesterName) return null;
  return db.select().from(semesters).where(eq(semesters.name, semesterName)).get();
};

util.getMemberByStudentId = function(studentId) {
  return db.select().from(members).where(eq(members.studentId, String(studentId))).get();
};

const c = {
  r: '\x1b[0m', d: '\x1b[2m', b: '\x1b[1m',
  red: '\x1b[31m', grn: '\x1b[32m', ylw: '\x1b[33m', cyn: '\x1b[36m',
};

util.logger = function(log) {
  const fn = log.level === 'error' ? console.error : console.log;
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const lvl = log.level === 'error' ? `${c.red}${c.b}ERR${c.r}` : `${c.grn}INF${c.r}`;

  let line = `${lvl} ${c.d}${ts}${c.r} `;

  if (log.method === 'internal') {
    line += `${c.d}[${log.IP}]${c.r} `;
  } else {
    line += `${c.cyn}${log.method}${c.r} ${log.endpoint} `;
  }

  if (log.status > 0) {
    const sc = log.status >= 500 ? c.red : log.status >= 400 ? c.ylw : c.d;
    line += `${sc}${log.status}${c.r} `;
  }

  line += log.description;

  if (log.method !== 'internal' && log.IP) {
    line += ` ${c.d}← ${log.IP}${c.r}`;
  }

  fn(line);

  if (log.level === 'error') {
    const trunc = (v) => {
      if (v == null) return null;
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return s.length > 200 ? s.slice(0, 200) + '…' : s;
    };
    if (log.query != null) fn(`    ${c.d}query:${c.r}  ${trunc(log.query)}`);
    if (log.result != null) fn(`    ${c.d}result:${c.r} ${trunc(log.result)}`);
  }
};

export default util;
