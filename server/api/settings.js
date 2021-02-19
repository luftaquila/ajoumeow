import dotenv from 'dotenv'
import express from 'express';
import dateformat from 'dateformat';
import bodyParser from 'body-parser';

import logger from '../config/winston';
import util from '../controllers/util/util.js';
import Response from '../controllers/util/response.js';

dotenv.config();

let router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

router.get('*', async (req, res) => {
  try {
    let result = await util.getSettings(req.url.substring(1));
    res.status(200).json(new Response('success', '', result));
  }
  catch(e) {
    //logger.error();
    console.log(e);
    res.status(500).json(new Response('error', e.message, 'ERR'));
  }
});

router.put('*', util.isAdmin, async (req, res) => {
  try {
    let result = await util.query(`UPDATE settings SET value='${req.body.data}' WHERE name='${req.url.substring(1)}'`);
    res.status(200).json(new Response('success', '', result));
  }
  catch(e) {
    //logger.error();
    console.log(e);
    res.status(500).json(new Response('error', e.message, 'ERR'));
  }
});

export default router