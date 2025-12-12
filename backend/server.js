// backend/server.js
const express = require('express');
const cors = require('cors');
const { initDB, pool } = require('./db'); // Import pool too

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// Add this AFTER the static middleware but BEFORE your API routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Routes
const postsRouter = require('./routes/posts');
app.use('/api/posts', postsRouter);

// Test route to check if API is working
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


// Add this route to see ALL database records
app.get('/api/db/inspect', async (req, res) => {
  try {
    // Get all posts
    const posts = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    
    // Get all users
    const users = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    
    // Get database info
    const dbInfo = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT MAX(created_at) FROM posts) as latest_post,
        version() as postgres_version
    `);
    
    res.json({
      database: process.env.DB_NAME,
      info: dbInfo.rows[0],
      posts: posts.rows,
      users: users.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Initialize database and start server
const startServer = async () => {
  try {
    await initDB();
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ API available at http://localhost:${PORT}/api/posts`);
      console.log(`✅ Health check at http://localhost:${PORT}/api/health`);
      console.log(`✅ Frontend at http://localhost:${PORT}`);
    });
    
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(startServer, 5000); // Retry after 5 seconds
  }
};

startServer();