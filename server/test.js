import pool from './config/mariadb.js';

(async () => {
  const db = await pool.getConnection();
  const query = await db.query('SHOW TABLES');
  db.end();
  console.log(query);
})();
