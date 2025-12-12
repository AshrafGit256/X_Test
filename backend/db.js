// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Use Render's DATABASE_URL or local .env
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// backend/db.js - Updated initDB function
const initDB = async () => {
  const client = await pool.connect();
  try {
    console.log('Initializing database with full schema...');
    
    // Drop and recreate with ALL columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        content TEXT,
        media_urls TEXT[],
        media_type VARCHAR(20),
        likes_count INT DEFAULT 0,
        retweets_count INT DEFAULT 0,
        replies_count INT DEFAULT 0,
        is_retweet BOOLEAN DEFAULT FALSE,
        original_post_id INT,
        original_username VARCHAR(50),
        parent_post_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create post_likes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        username VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, username)
      )
    `);
    
    // Create retweets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS retweets (
        id SERIAL PRIMARY KEY,
        post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        username VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, username)
      )
    `);
    
    console.log('✅ All database tables created with full schema');
    
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// Add this test to db.js after pool creation
pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

module.exports = { pool, initDB };