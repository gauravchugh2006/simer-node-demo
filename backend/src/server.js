import app from './app.js';
import pool from './utils/db.js';

const port = process.env.PORT || 4000;

const start = async () => {
  try {
    await pool.query('SELECT 1');
    app.listen(port, () => {
      console.log(`Cafe Coffee Day API listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database', error);
    process.exit(1);
  }
};

start();
