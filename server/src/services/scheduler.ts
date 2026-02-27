import schedule from 'node-schedule';
import { lt, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { logs } from '../db/schema.js';

/**
 * Start scheduled tasks.
 * - Daily at midnight: delete logs older than 30 days.
 */
export function startScheduler() {
  // Every day at 00:00 (midnight KST — server TZ should be Asia/Seoul)
  schedule.scheduleJob('0 0 * * *', () => {
    try {
      const cutoff = sql`datetime('now', '-30 days')`;
      const result = db.delete(logs).where(lt(logs.timestamp, cutoff)).run();
      console.log(`[scheduler] Deleted ${result.changes} logs older than 30 days`);
    } catch (err) {
      console.error('[scheduler] Failed to clean up old logs:', err);
    }
  });
}
