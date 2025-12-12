// backend/migrate.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting database migration...');
    
    // Check current columns
    const { rows: columns } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts'
    `);
    
    const columnNames = columns.map(c => c.column_name);
    console.log('Current columns:', columnNames);
    
    // Add missing columns
    const neededColumns = [
      { name: 'media_urls', type: 'TEXT[]' },
      { name: 'media_type', type: 'VARCHAR(20)' },
      { name: 'likes_count', type: 'INT DEFAULT 0' },
      { name: 'retweets_count', type: 'INT DEFAULT 0' },
      { name: 'replies_count', type: 'INT DEFAULT 0' },
      { name: 'is_retweet', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'original_post_id', type: 'INT' },
      { name: 'original_username', type: 'VARCHAR(50)' },
      { name: 'parent_post_id', type: 'INT' }
    ];
    
    for (const column of neededColumns) {
      if (!columnNames.includes(column.name)) {
        console.log(`Adding column: ${column.name}`);
        await client.query(`
          ALTER TABLE posts 
          ADD COLUMN ${column.name} ${column.type}
        `);
      }
    }
    
    // Create interaction tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        username VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, username)
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS retweets (
        id SERIAL PRIMARY KEY,
        post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        username VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, username)
      )
    `);
    
    console.log('✅ Migration completed successfully!');
    
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrate();