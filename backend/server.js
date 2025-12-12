// backend/server.js
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const postsRouter = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Routes
app.use('/api/posts', postsRouter);

// Initialize database and start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});