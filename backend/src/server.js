import app from './app.js';
import pool from './utils/db.js';
import { logError, logInfo } from './utils/logger.js';

const port = process.env.PORT || 4000;
let server;
let isShuttingDown = false;

const start = async () => {
  try {
    await pool.query('SELECT 1');
    server = app.listen(port, () => {
      logInfo(`Cafe Coffee Day API listening on port ${port}`);
    });
  } catch (error) {
    logError('Failed to connect to the database', error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logInfo(`Received ${signal}. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logInfo('HTTP server closed');
    }
    await pool.end();
    logInfo('Database pool closed');
  } catch (error) {
    logError('Error during graceful shutdown', error);
  } finally {
    process.exit(0);
  }
};

['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

start();
