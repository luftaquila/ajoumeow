import express from 'express';
import dateformat from 'dateformat';
import bodyParser from 'body-parser';

import logger from '../config/winston';
import util from '../controllers/util/util.js';
import Response from '../controllers/util/response.js';

let router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

//const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;

router.get('/name', util.isAdmin, async (req, res) => {
  try {
    let result = await util.query(`SELECT name, ID FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE name LIKE '%${req.query.query}%';`);
    res.status(200).json(new Response('success', null, result));
  }
  catch(e) {
    res.status(500).json(new Response('error', 'Unknown error', 'ERR_UNKNOWN'));
  }
});

export default router