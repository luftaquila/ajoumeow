import util from 'util'
import express from 'express'
import mariadb from 'mariadb'
import winston from 'winston'
import bodyParser from 'body-parser'
import { Server } from 'socket.io'

// mariadb configuration
const pool = mariadb.createPool({
  host: 'localhost', 
  user:'ajouclubfair',
  database: 'ajouclubfair',
  idleTimeout: 0
});

// winston logger configuration
const logger = new winston.createLogger({
  transports: [
    new winston.transports.File({
      level: 'info',
      filename: '.log',
      maxsize: 10485760, //10MB
      maxFiles: 1,
      showLevel: true,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      )
    })
  ],
  exitOnError: false,
});

// DB query
const query = async query => {
  try {
    const db = await pool.getConnection();
    const result = await db.query(query);
    await db.end();
    logger.info('DB query', { query: query });
    return result;
  } catch(e) { logger.error('DB query error', { query: query, error: util.format(e) }); }
}


// socket configuration
const io = new Server(3180);
io.on('connection', socket => {
  socket.on('getInventory', async data => {
    const result = await query(`SELECT * FROM goods;`);
    io.emit('inventoryStatus', result);
    logger.info('::getInventory', { result: result });
  });
});


// express configuration
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(3170, async () => logger.info('Server startup') );

// express apis
// manager login
app.get(['/manager', '/manager/:id'], async (req, res) => {
  const result = await query(`SELECT * FROM manager WHERE id=${req.params.id};`);
  if(result && result.length) res.json(result[0]);
  else res.status(404).send('No such user found.');
  logger.info('/manager', { id: req.params.id });
});

// on sell
app.post('/sell', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for(const item of req.body.detail) await conn.query(`UPDATE goods SET inventory=inventory-${item.quantity} WHERE id=${item.id}`);
    await conn.query(`INSERT INTO log(manager, price, detail, note) VALUES('${req.body.manager}', ${req.body.price}, '${JSON.stringify(req.body.detail)}', '${req.body.reason}')`);
    await conn.commit();
    res.send('ok');

    const result = await query(`SELECT * FROM goods;`);
    io.emit('inventoryStatus', result);

    logger.info('/sell', { type: 'POST', req: JSON.stringify(req.body) });
  } catch(e) {
    await conn.rollback();
    res.status(500).send(e.code);
    logger.error('/sell', { type: 'POST', req: JSON.stringify(req.body), code: e.code });
  } finally { await conn.release(); }
});

// on get sell log
app.get('/sell', async (req, res) => {
  const result = await query(`SELECT * FROM log;`);
  res.send(result);
  logger.info('log loading');
});

// on delete sell log
app.delete('/sell', async(req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for(const id of req.body.delete) {
      const result = await conn.query(`SELECT * FROM log where id=${id}`);
      const detail = JSON.parse(result[0].detail);
      for(const item of detail) await conn.query(`UPDATE goods SET inventory=inventory+${item.quantity} WHERE id=${item.id}`);
      await conn.query(`DELETE FROM log WHERE id=${id}`);
    }
    await conn.commit();
    res.send('ok');
    
    const result = await query(`SELECT * FROM goods;`);
    io.emit('inventoryStatus', result);

    logger.info('/sell', { type: 'DELETE', req: JSON.stringify(req.body.delete) });
  } catch(e) {
    await conn.rollback();
    res.status(500).send(e.code);
    logger.error('/sell', { type: 'DELETE', req: JSON.stringify(req.body.delete), code: e.code });
  } finally { await conn.release(); }
});