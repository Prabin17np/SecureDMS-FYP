// Single shared connection pool. Every query in the app should go
// through this pool's parameterized query() method — never build
// SQL strings by concatenating user input.

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'sdms',
  max: 10,                     // max connections in the pool
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  // Catches errors on idle clients so a bad connection doesn't crash the app
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;