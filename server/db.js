const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'academic_assistance',
  password: '1019', // Replace with your PostgreSQL password
  port: 5432,
});

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        branch VARCHAR(50),
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doubts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        branch VARCHAR(50),
        location VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS responses (
        id SERIAL PRIMARY KEY,
        doubt_id INTEGER NOT NULL,
        responder_id VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        contact_info VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doubt_id) REFERENCES doubts(id) ON DELETE CASCADE,
        FOREIGN KEY (responder_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err; // This will stop the server if initialization fails
  }
}

async function testConnection() {
  const res = await pool.query('SELECT NOW()');
  console.log('Database connection successful:', res.rows[0].now);
}

module.exports = { pool, initializeDatabase, testConnection };