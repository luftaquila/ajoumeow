const ejs = require('ejs');
const express = require('express');
const mariadb = require('mariadb');
const bodyParser = require('body-parser');
const session = require('express-session');
const sessionDatabase = require('express-mysql-session')(session);
const DBOptions = {
  host: 'localhost', 
  user:'root', 
  password: 'luftaquila',
  database: 'ajoumeow'
};
const pool = mariadb.createPool(DBOptions);
const sessionDB = new sessionDatabase(DBOptions);

let db;
(async () => { db = await pool.getConnection(); })()

const app = express();
//app.use('/', express.static('../'));
app.set("view engine", "ejs");
app.set('views', 'views');
app.engine('html', ejs.renderFile);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
 secret: '@+*LU_Ft%AQuI-|!la#@$',
 resave: false,
 saveUninitialized: true,
 store: sessionDB
}));

app.get('/', async function(req, res) {
  console.log(new Date(), 'start')
  let record = await db.query("SELECT * FROM record;")
  let namelist = await db.query("SELECT * FROM `namelist_20-1`;");
  res.status(200)
  for(let obj of record) {
    let target = namelist.find(o => o.name == obj.name);
    if(target) await db.query("UPDATE record SET ID=" + target.ID + " WHERE name='" + obj.name + "';");
  }
  console.log(new Date(), 'ok')
});

app.post('//loginCheck', async function(req, res) {
  if(req.session.isLogin) {
    let query = await db.query('SELECT name, ID, role FROM `namelist_' + await settings('currentSemister') + "` WHERE ID='" + req.session.ID + "';");
    res.send({ 'name' : query[0].name, 'id' : query[0].ID, 'role' : query[0].role });
  }
  else res.send({ 'name' : null, 'id' : null, 'role' : null });
});

app.post('//login', async function(req, res) {
  let query = await db.query('SELECT name, ID, role FROM `namelist_' + await settings('currentSemister') + "` WHERE ID='" + req.body['ID'] + "';");
  if(query[0]) {
    req.session.ID = req.body['ID'];
    req.session.isLogin = true;
    res.send({ 'name' : query[0].name, 'id' : query[0].ID, 'role' : query[0].role });
  }
  else res.send({ 'name' : null, 'id' : null, 'role' : null });
});

app.post('//logout', async function(req, res) {
  req.session.destroy();
  res.send({ 'result' : 'success' });
});

app.post('//apply', async function(req, res) {
  let query = 'INSERT INTO `namelist_' + await settings('currentSemister') + '`(college, department, ID, name, phone, birthday, 1365ID, register)' +
      " VALUES('" + req.body['단과대학'] + "', '" + req.body['학과'] + "', '" + req.body['학번'] + "', '" + req.body['이름'] + "', '" + req.body['전화번호'] + "', '" + req.body['생년월일'] + "', '" + req.body['1365 아이디'] + "', '" + req.body['가입 학기'] + "');";
  try { res.send(await db.query(query)); }
  catch(e) { res.send({ 'result' : null, 'error' : e }); }
});

app.post('//requestApply', async function(req, res) {
  let applyTerm = await settings('applyTerm');
  applyTerm = applyTerm.split('~');
  if((new Date() > new Date(applyTerm[0]) && new Date() < new Date(new Date(applyTerm[1]).getTime() + 60 * 60 * 24 * 1000)) || (await settings('isAllowAdditionalApply') == 'TRUE'))
    res.send({ 'result' : true });
  else res.send({ 'result' : null });
});

app.post('//requestRegister', async function(req, res) {
  let registerTerm = await settings('registerTerm');
  registerTerm = registerTerm.split('~');
  if((new Date() > new Date(registerTerm[0]) && new Date() < new Date(new Date(registerTerm[1]).getTime() + 60 * 60 * 24 * 1000)) || (await settings('isAllowAdditionalRegister') == 'TRUE'))
    await res.send({ 'result' : true, 'semister' : await settings('currentSemister') });
  else res.send({ 'result' : null });
});

app.post('//modifySettings', async function(req, res) {
  try {
    let query = await db.query('UPDATE settings SET value' + "='" + req.body.editData + "' WHERE name='" + req.body.editParam + "';");
    res.send({ 'result' : true });
  }
  catch(e) { res.send({ 'result' : null, 'error' : e }); }
  
});

app.post('//records', async function(req, res) {
  let query = "SELECT * FROM record WHERE date BETWEEN '" + req.body.startDate + "' AND '" + req.body.endDate + "' ORDER BY date, course, timestamp;";
  let set = await db.query(query);
  res.send(set);
});

app.post('//requestSettings', async function(req, res) {
  let query = await db.query('SELECT * FROM settings;');
  let reply = {};
  for(let obj of query) reply[obj.name] = obj.value;
  res.send(reply);
});

app.post('//requestNameList', async function(req, res) {
  let semister;
  if(req.body.semister == 'this') semister = await settings('currentSemister');
  else if(req.body.semister == 'past') {
    let tmp = await settings('currentSemister').split('-');
    if(tmp[1] == '2') semister = tmp[0] + '-1';
    else semister = (Number(tmp[0]) - 1) + '-2';
  }
  else semister = req.body.semister;
  let query = await db.query('SELECT * FROM `namelist_' + semister + '`;');
  res.send(query);
});

app.post('//isAllowedAdminConsole', async function(req, res) {
  try {
    let query = await db.query('SELECT role FROM `namelist_' + await settings('currentSemister') + "` WHERE ID='" + req.session.ID + "';");
    if(query[0].role != "회원") res.send({ 'result' : true });
    else res.send({ 'result' : null });
  }
  catch(e) { res.send({ 'result' : null, 'error' : e }); }
});

app.post('//modifyMember', async function(req, res) {
  try {
    let data = req.body;
    let query = await db.query('UPDATE `namelist_' + await settings('currentSemister') + "` SET college='" + data.college + "', department='" + data.department + "', name='" + data.name + "', phone='" + data.phone + "', birthday='" + data.birthday + "', 1365ID='" + data['1365ID'] + "', role='" + data.role + "', register='" + data.register + "' WHERE ID='" + data.ID + "';");
    res.send({ 'result' : true });
  }
  catch(e) { res.send({ 'result' : null, 'error' : e }); }
});

app.post('//insertIntoTable', async function(req, res) {
  try {
    let payload = req.body;
    let test = await db.query("SELECT * FROM record WHERE ID=" + payload.ID + " AND name='" + payload.name + "' AND date='" + payload.date + "' AND course='" + payload.course + "';");
    if(test.length) return res.status(406).send({ 'result' : null, 'error' : { 'code' : 'DUP_RECORD' } }); 
    let query = "INSERT INTO record(ID, name, date, course) VALUES(" + payload.ID + ", '" + payload.name + "', '" + payload.date + "', '" + payload.course + "');";
    await db.query(query);
    res.send({ 'result' : true });
  }
  catch(e) { res.status(406).send({ 'result' : null, 'error' : e }); }
});

app.post('//deleteFromTable', async function(req, res) {
  try {
    let payload = req.body;
    let query = "DELETE FROM record WHERE ID=" + payload.ID + " AND name='" + payload.name + "' AND date='" + payload.date + "' AND course='" + payload.course + "';";
    await db.query(query);
    res.send({ 'result' : true });
  }
  catch(e) { res.send({ 'result' : null, 'error' : e }); }
});

app.listen(5710, () => { console.log('Server Started'); });

async function settings(name) {
  let res = await db.query(`SELECT name, value FROM settings WHERE name='` + name + `';`);
  return res[0].value;
}
  
  