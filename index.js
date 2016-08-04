import Promise from 'bluebird';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import config from './config/env';
import app from './config/express';

// promisify mongoose
Promise.promisifyAll(mongoose);

// connect to mongo db
mongoose.connect(config.db, { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on('error', () => {
  throw new Error(`Unable to connect to database: ${config.db}`);
});

const debug = require('debug')('cast-feed-server:index');

// listen on port config.port
app.listen(config.port, () => {
  debug(`server started on port ${config.port} (${config.env})`);
});

export default app;
