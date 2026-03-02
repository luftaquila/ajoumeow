import mariadb from 'mariadb'

const pool = mariadb.createPool({
  host: 'mariadb',
  user: 'root',
  password: '',
  database: 'ajoumeow',
  idleTimeout: 0
});

export default pool;
