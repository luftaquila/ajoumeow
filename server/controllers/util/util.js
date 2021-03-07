import dotenv from 'dotenv'
import jwt from 'jsonwebtoken';
import prettify from 'pretty-format';
//import inspect from 'object-inspect';

import { Response, Log } from './interface.js';
import pool from '../../config/mariadb';

dotenv.config();

let util = {};

util.isLogin = function(req, res, next) { // check if jwt is vaild
  const token = req.headers['x-access-token'];
  if(!token) {
    util.logger(new Log('info', 'util', 'util.isLogin', '로그인 확인', 'internal', 400, token, 'ERR_NO_TOKEN'));
    res.status(400).json(new Response('error', '로그인 상태가 아닙니다.', 'ERR_NO_TOKEN'));
  }
  else {
    jwt.verify(token, process.env.JWTSecret, function(err, decoded) {
      if(err) {
        util.logger(new Log('info', 'util', 'util.isLogin', '로그인 확인', 'internal', 401, token, 'ERR_INVALID_TOKEN'));
        res.status(401).json(new Response('error', '로그인이 만료되었습니다.<br>다시 로그인해 주세요.', 'ERR_INVALID_TOKEN'));
      }
      else {
        req.decoded = decoded;
        util.logger(new Log('info', 'util', 'util.isLogin', '로그인 확인', 'internal', 0, token, req.decoded));
        next();
      }
    });
  }
};

util.isAdmin = function(req, res, next) { // check if jwt is vaild
  const token = req.headers['x-access-token'];
  if(!token) {
    util.logger(new Log('info', 'util', 'util.isAdmin', '관리자 확인', 'internal', 400, token, 'ERR_NO_TOKEN'));
    res.status(400).json(new Response('error', '로그인 상태가 아닙니다.', 'ERR_NO_TOKEN'));
  }
  else {
    jwt.verify(token, process.env.JWTSecret, function(err, decoded) {
      if(err) {
        util.logger(new Log('info', 'util', 'util.isAdmin', '관리자 확인', 'internal', 401, token, 'ERR_INVALID_TOKEN'));
        res.status(401).json(new Response('error', '로그인이 만료되었습니다.<br>다시 로그인해 주세요.', 'ERR_INVALID_TOKEN'));
      }
      else if(decoded.role == '회원') {
        util.logger(new Log('info', 'util', 'util.isAdmin', '관리자 확인', 'internal', 403, token, 'ERR_USER_NOT_ADMIN'));
        res.status(403).json(new Response('error', '관리자가 아닙니다.', 'ERR_USER_NOT_ADMIN'));
      }
      else {
        req.decoded = decoded;
        util.logger(new Log('info', 'util', 'util.isAdmin', '관리자 확인', 'internal', 0, token, req.decoded));
        next();
      }
    });
  }
};

util.query = async function(query) { // make db query
  try {
    const db = await pool.getConnection();
    const result = await db.query(query);
    await db.end();
    util.logger(new Log('info', 'DB', 'util.query', 'DB 쿼리', 'internal', 0, query, result));
    return result;
  }
  catch(e) {
    console.log(e);
    throw e;
    util.logger(new Log('error', 'DB', 'util.query', 'DB 쿼리 오류', 'internal', -1, query, e.stack));
  }
}

util.getSettings = async function(name) { // request server settings by name
  const result = await util.query(`SELECT value FROM settings WHERE name='${name}';`);
  if(result.length) return result[0].value;
  else return null;
}

util.logger = async function(log) {
  try {
    log = logValidator(log);
    const db = await pool.getConnection();
    const query = `INSERT INTO \`log\` (\`level\`, \`IP\`, \`endpoint\`, \`description\`, \`method\`, \`status\`, \`query\`, \`result\`) VALUES(${db.escape(log.level)}, ${db.escape(log.IP)}, ${db.escape(log.endpoint)}, ${db.escape(log.description)}, ${db.escape(log.method)}, ${db.escape(log.status)}, ${db.escape(log.query)}, ${db.escape(log.result)});`;
    const result = await db.query(query);
    await db.end();
  }
  catch(e) { console.log(e); }
}

function logValidator(log) {
  for(let prop of Object.getOwnPropertyNames(log)) {
    if(typeof(log[prop]) == 'object') {
      log[prop] = prettify(log[prop], { min: true });
      if(log[prop].length > 300) log[prop] = log[prop].substr(0, 300) + '...';
    }
  }
  return log;
}

export default util