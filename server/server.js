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

app.post('/', async function(req, res) {
  console.log(req.body);
});

app.post('//loginCheck', async function(req, res) {
  if(req.session.isLogin) {
    let query = await db.query('SELECT name FROM `namelist_' + await settings('currentSemister') + "` WHERE ID='" + req.session.ID + "';");
    res.send({ 'name' : query[0].name });
  }
  else res.send({ 'name' : null });
});

app.post('//login', async function(req, res) {
  let query = await db.query('SELECT name FROM `namelist_' + await settings('currentSemister') + "` WHERE ID='" + req.body['ID'] + "';");
  if(query[0]) {
    req.session.ID = req.body['ID'];
    req.session.isLogin = true;
    res.send({ 'name' : query[0].name });
  }
  else res.send({ 'name' : null });
});

app.post('//logout', async function(req, res) {
  req.session.destroy();
  res.send({ 'result' : 'success' });
});

app.post('//apply', async function(req, res) {
  let query = 'INSERT INTO `namelist_' + await settings('currentSemister') + '`(college, department, ID, name, phone, birthday, 1365ID, register)' +
      " VALUES('" + req.body['단과대학'] + "', '" + req.body['학과'] + "', '" + req.body['학번'] + "', '" + req.body['이름'] + "', '" + req.body['전화번호'] + "', '" + req.body['생년월일'] + "', '" + req.body['1365 아이디'] + "', '" + req.body['가입 학기'] + "');";
  try { res.send(await db.query(query)); }
  catch(err) { res.send({ 'error' : err.code }); }
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
  catch(err) { res.send({ 'result' : null }); }
  
});

app.post('//records', async function(req, res) {
  
});

app.post('//requestNamelist', async function(req, res) {
  let query = 'SELECT * FROM ';
});

app.post('//requestNamelistFor1365', async function(req, res) {
  let query = 'SELECT ID, name, birthday, 1365ID FROM `' + req.body.semister + '`;';
  let data = await db.query(query), str = "";
  for(let content of data) str += content.ID + ',' + content.name + ',' + content.birthday + ',' + content['1365ID'] + '\n';
  res.send(str);
  
});

app.post('//requestSettings', async function(req, res) {
  let query = await db.query('SELECT * FROM settings;');
  let reply = {};
  for(let obj of query) reply[obj.name] = obj.value;
  res.send(reply);
});

app.post('//requestMemberList', async function(req, res) {
  let query = await db.query('SELECT * FROM `namelist_' + req.body.semister + '`;');
  res.send(query);
});

app.post('//isAllowedAdminConsole', async function(req, res) {
  try {
    let query = await db.query('SELECT role FROM `namelist_' + await settings('currentSemister') + "` WHERE ID='" + req.session.ID + "';");
    if(query[0].role != "회원") res.send({ 'result' : true });
    else res.send({ 'result' : null });
  }
  catch { res.send({ 'result' : null }); }
});

app.post('//modifyMember', async function(req, res) {
  try {
    let data = req.body;
    let query = await db.query('UPDATE `namelist_' + await settings('currentSemister') + "` SET college='" + data.college + "', department='" + data.department + "', name='" + data.name + "', phone='" + data.phone + "', birthday='" + data.birthday + "', 1365ID='" + data['1365ID'] + "', role='" + data.role + "', register='" + data.register + "' WHERE ID='" + data.ID + "';");
    res.send({ 'result' : true });
  }
  catch(e) { res.send({ 'result' : null }); }
});

app.listen(5710, () => { console.log('Server Started'); });

async function settings(name) {
  let res = await db.query(`SELECT name, value FROM settings WHERE name='` + name + `';`);
  return res[0].value;
}
  
  