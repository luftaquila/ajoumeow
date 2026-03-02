import schedule from 'node-schedule';

import { sqlite } from '../db/index.js';
import util from './util/util.js';
import { Log } from './util/interface.js';

function dbClient() {
  const msg = 'DB Client is in startup.';
  console.log(msg);
  util.logger(new Log('info', 'dbClient', 'dbClient()', '로그 삭제 프로그램 시작', 'internal', 0, null, msg));
  const log_schedule = schedule.scheduleJob('0 0 * * *', () => {
    const query = `DELETE FROM logs WHERE timestamp < datetime('now', '-30 days')`;
    sqlite.prepare(query).run();
    util.logger(new Log('info', 'dbClient', 'log_schedule', '정기 로그 삭제', 'internal', 0, query, 'done'));
  });
}

export default dbClient;
