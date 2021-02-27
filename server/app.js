import express from 'express';

import auth from './api/auth.js';
import settings from './api/settings.js';
import record from './api/record.js';
import verify from './api/verify.js';
import users from './api/users.js';

import util from './controllers/util/util.js';
import { Log } from './controllers/util/interface.js';

import client from './config/node-kakao'
import kakaoClient from './controllers/kakaoClient.js';
import weatherClient from './controllers/weatherClient.js';
import dbClient from './controllers/dbClient.js';

const app = express();
app.use((req, res, next) => { 
  req.originalPath = req.baseUrl + req.path;
  req.remoteIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  next();
});
app.use('/api/auth', auth);
app.use('/api/settings', settings);
app.use('/api/record', record);
app.use('/api/verify', verify);
app.use('/api/users', users);

app.listen(5710, function() {
  const msg = 'API server is in startup. Listening on :5710';
  console.log(msg);
  util.logger(new Log('info', 'LOCALHOST', '/api', '서버 프로그램 시작', 'internal', 0, null, msg));
});

client.login(
  process.env.TalkClientLoginID,
  process.env.TalkClientLoginPW,
  true
).then(kakaoClient);
weatherClient();
dbClient();