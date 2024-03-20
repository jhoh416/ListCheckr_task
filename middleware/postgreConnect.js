const { Pool } = require('pg');

const pgPool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'postgres',
  password: '1234',
  port: 5432,
});

module.exports = pgPool;