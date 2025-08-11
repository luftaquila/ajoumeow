import dotenv from 'dotenv'
import mariadb from 'mariadb'

dotenv.config();

const pool = mariadb.createPool({
  host: 'mariadb',
  user: 'root',
  password: '',
  database: 'ajoumeow',
  idleTimeout: 0
});

export default pool;
