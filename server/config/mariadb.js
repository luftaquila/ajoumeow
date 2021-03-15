import dotenv from 'dotenv'
import mariadb from 'mariadb'

dotenv.config();

const pool = mariadb.createPool({
  host: process.env.DBHost, 
  user: process.env.DBUser,
  password: process.env.DBPW,
  database: process.env.DBName,
  idleTimeout: 0
});

export default pool;