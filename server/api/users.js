import express from 'express';
import dateformat from 'dateformat';
import bodyParser from 'body-parser';

import logger from '../config/winston';
import util from '../controllers/util/util.js';
import Response from '../controllers/util/response.js';

let router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

//const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;

// Get namelist table by semister
router.get('/list', util.isAdmin, async (req, res) => {
  try {
    if(req.query.semister == 'all') {
      let result = await util.query(`SHOW TABLES LIKE '%namelist_%';`);
      let map = result.map(x => x['Tables_in_ajoumeow (%namelist_%)']);
      res.status(200).json(new Response('success', null, map));
    }
    else {
      let result = await util.query(`SELECT * FROM \`namelist_${req.query.semister}\`;`);
      res.status(200).json(new Response('success', null, result));
    }
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

// Get users info by name
router.get('/name', util.isAdmin, async (req, res) => {
  try {
    let result = await util.query(`SELECT name, ID FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE name LIKE '%${req.query.query}%';`);
    res.status(200).json(new Response('success', null, result));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

// Get user info by id
router.get('/id', util.isAdmin, async (req, res) => {
  
});

// Add new user
router.post('/id', async (req, res) => {
  
});

// Modify user info by id
router.put('/id', util.isAdmin, async (req, res) => {
  try {
    let result = await util.query(`UPDATE \`namelist_${await util.getSettings('currentSemister')}\` SET college='${req.body.college}', department='${req.body.department}', name='${req.body.name}', phone='${req.body.phone}', birthday='${req.body.birthday}', 1365ID='${req.body['1365ID']}', role='${req.body.role}', register='${req.body.register}' WHERE ID=${req.body.ID};`);
    res.status(200).json(new Response('success', null, result));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

// Delete user by id
router.delete('/id', util.isAdmin, async (req, res) => {
  try {
    if(!req.body.ID) req.body.ID = 0;
    let result = await util.query(`DELETE FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE ID=${req.body.ID}`);
    if(result.affectedRows) res.status(200).json(new Response('success', null, result));
    else res.status(400).json(new Response('error', 'No matching ID', 'ERR_NO_MATCHING_ID'));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

export default router