const mysql = require('mysql2/promise');
require('dotenv').config();

const maxRetries = Number(process.env.DB_WAIT_MAX_RETRIES || 30);
const intervalMs = Number(process.env.DB_WAIT_INTERVAL_MS || 1000);

async function waitForDb() {
  const config = {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  for (let i = 0; i < maxRetries; i++) {
    try {
      const conn = await mysql.createConnection(config);
      await conn.ping();
      await conn.end();
      console.log('Database is ready!');
      return true;
    } catch (err) {
      console.log(`Waiting for DB to be ready... attempt ${i + 1}/${maxRetries}`);
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  console.error('DB did not become ready in time. Exiting.');
  process.exit(1);
}

waitForDb();
