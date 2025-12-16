// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB, pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/posts/uploads', express.static(path.join(__dirname, 'uploads')));

// Static files - conditionally for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend')));
} else {
  app.use(express.static(path.join(__dirname, '../frontend')));
}

// Routes

// Add this route BEFORE your other routes
app.get('/api/fix-database', async (req, res) => {
  try {
    console.log('Attempting to update database schema...');
    
    // Check current structure
    const check = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts'
    `);
    
    console.log('Current columns:', check.rows.map(r => r.column_name));
    
    // Add missing columns
    await pool.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS media_urls TEXT[],
      ADD COLUMN IF NOT EXISTS media_type VARCHAR(20),
      ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS retweets_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS replies_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_retweet BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS original_post_id INT,
      ADD COLUMN IF NOT EXISTS original_username VARCHAR(50),
      ADD COLUMN IF NOT EXISTS parent_post_id INT
    `);
    
    // Verify
    const after = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts'
    `);
    
    console.log('Updated columns:', after.rows.map(r => r.column_name));
    
    res.json({ 
      success: true, 
      message: 'Database schema updated successfully',
      columns: after.rows.map(r => r.column_name)
    });
    
  } catch (err) {
    console.error('Schema update failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API Routes
const postsRouter = require('./routes/posts');
app.use('/api/posts', postsRouter);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time, version() as version');
    res.json({
      status: 'healthy',
      database: 'connected',
      time: result.rows[0].time,
      version: result.rows[0].version.split(',')[0]
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: err.message 
    });
  }
});

// Database inspection
app.get('/api/db/inspect', async (req, res) => {
  try {
    const posts = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    const users = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    
    const dbInfo = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT MAX(created_at) FROM posts) as latest_post,
        version() as postgres_version
    `);
    
    res.json({
      database: process.env.DB_NAME || 'xclone',
      info: dbInfo.rows[0],
      posts: posts.rows,
      users: users.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin database view
app.get('/admin/db', async (req, res) => {
  try {
    const posts = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    const users = await pool.query('SELECT * FROM users');
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Database Records</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f2f2f2; }
          tr:hover { background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>Database Records</h1>
        <h2>Posts (${posts.rows.length})</h2>
        <table>
          <tr><th>ID</th><th>User</th><th>Content</th><th>Time</th></tr>
    `;
    
    posts.rows.forEach(post => {
      html += `
        <tr>
          <td>${post.id}</td>
          <td>${post.username}</td>
          <td>${post.content}</td>
          <td>${new Date(post.created_at).toLocaleString()}</td>
        </tr>`;
    });
    
    html += `
        </table>
        <h2>Users (${users.rows.length})</h2>
        <table>
          <tr><th>ID</th><th>Username</th><th>Display Name</th><th>Created</th></tr>
    `;
    
    users.rows.forEach(user => {
      html += `
        <tr>
          <td>${user.id}</td>
          <td>${user.username}</td>
          <td>${user.display_name || '(not set)'}</td>
          <td>${new Date(user.created_at).toLocaleString()}</td>
        </tr>`;
    });
    
    html += `
        </table>
        <br>
        <a href="/">Back to Home</a> | 
        <a href="/api/health">Health Check</a> | 
        <a href="/api/posts">Posts API</a>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (err) {
    res.send(`<h1>Error</h1><p>${err.message}</p>`);
  }
});

// Initialize and start server
const startServer = async () => {
  try {
    await initDB();
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Frontend: http://localhost:${PORT}`);
      console.log(`✅ API: http://localhost:${PORT}/api/posts`);
      console.log(`✅ Health: http://localhost:${PORT}/api/health`);
      console.log(`✅ Admin: http://localhost:${PORT}/admin/db`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(startServer, 5000);
  }
};

startServer();