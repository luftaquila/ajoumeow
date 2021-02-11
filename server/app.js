import express from 'express';

import auth from './api/auth.js';
import users from './api/users.js';
import settings from './api/settings.js';
import record from './api/record.js';
import verify from './api/verify.js';
import logger from './config/winston';

const app = express();
app.use('/api/auth', auth);
app.use('/api/settings', settings);

app.listen(5710, async function() {
  console.log('Server is on startup. PORT :5710');
  logger.info('Server is on startup.',
    { ip: 'LOCALHOST', url: 'SERVER', query: '-', result: 'Server is listening on port 5710'}
  );
});
