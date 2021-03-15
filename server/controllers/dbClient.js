import schedule from 'node-schedule'

import util from './util/util.js'
import { Log } from './util/interface.js';

async function dbClient() {
  const msg = 'DB Client is in startup.';
  console.log(msg);
  util.logger(new Log('info', 'dbClient', 'dbClient()', '로그 삭제 프로그램 시작', 'internal', 0, null, msg));
  const log_schedule = schedule.scheduleJob('0 0 * * *', async () => { // 00:00 at every day
    const query = `DELETE FROM log WHERE timestamp < now() - interval 30 DAY;`;
    const result = await util.query(query);
    util.logger(new Log('info', 'dbClient', 'log_schedule', '정기 로그 삭제', 'internal', 0, query, result));
  });
}

export default dbClient