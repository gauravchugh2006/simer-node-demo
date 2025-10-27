import app from './app.js';
import pool from './utils/db.js';
import { logError, logInfo } from './utils/logger.js';

const port = process.env.PORT || 4000;

const start = async () => {
  try {
    await pool.query('SELECT 1');
    app.listen(port, () => {
      logInfo(`Cafe Coffee Day API listening on port ${port}`);
    });
  } catch (error) {
    logError('Failed to connect to the database', error);
    process.exit(1);
  }
};

start();
