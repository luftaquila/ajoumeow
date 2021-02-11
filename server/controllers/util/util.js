import dotenv from 'dotenv'
import jwt from 'jsonwebtoken';
import Response from './response.js';
import pool from '../../config/mariadb';

dotenv.config();

let util = {};

util.isLogin = function(req, res, next) { // check if jwt is vaild
  const token = req.headers['x-access-token'];
  if(!token) res.status(400).json(new Response('error', 'Token required.', 'ERR_NO_TOKEN'));
  else {
    jwt.verify(token, process.env.JWTSecret, function(err, decoded) {
      if(err) res.status(401).json(new Response('error', 'Invaild token.', 'ERR_INVAILD_TOKEN'));
      else {
        req.decoded = decoded;
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
    return result;
  }
  catch(e) {
    // logger.error();
  }
}

util.getSettings = async function(name) { // request server settings by name
  const result = await util.query(`SELECT value FROM settings WHERE name='${name}';`);
  if(result.length) return result[0].value;
  else throw ReferenceError('No such settings name.');
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

export default util;