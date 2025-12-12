// backend/routes/posts.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Get all posts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM posts ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  try {
    const { username, content } = req.body;
    const result = await pool.query(
      'INSERT INTO posts (username, content) VALUES ($1, $2) RETURNING *',
      [username, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get post by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM posts WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;