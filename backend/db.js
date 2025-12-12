// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Improved initDB function
const initDB = async () => {
  const client = await pool.connect();
  try {
    console.log('Initializing database...');
    
    // Create posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Database tables created/verified successfully');
    
    // Test by inserting a sample post
    const testResult = await client.query(
      'INSERT INTO posts (username, content) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id',
      ['system', 'Welcome to X-Clone! Database is ready.']
    );
    
    if (testResult.rows[0]) {
      console.log('✅ Test post created with ID:', testResult.rows[0].id);
    }
    
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
    throw err; // Re-throw to handle in server.js
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };