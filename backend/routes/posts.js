const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const upload = require('../uploadConfig'); // Import upload config
const path = require('path');
const fs = require('fs');

// Get all posts with media
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

// Create post with media upload
router.post('/', upload.array('media', 4), async (req, res) => {
  try {
    const { username, content } = req.body;
    const files = req.files || [];
    
    // Determine media type
    let mediaType = null;
    const mediaUrls = [];
    
    if (files.length > 0) {
      // For local storage, create URLs
      files.forEach(file => {
        mediaUrls.push(`/uploads/${file.filename}`);
      });
      
      // Determine media type
      const hasImages = files.some(f => f.mimetype.startsWith('image'));
      const hasVideos = files.some(f => f.mimetype.startsWith('video'));
      
      if (hasImages && hasVideos) mediaType = 'mixed';
      else if (hasImages) mediaType = 'image';
      else if (hasVideos) mediaType = 'video';
    }
    
    const result = await pool.query(
      'INSERT INTO posts (username, content, media_urls, media_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, content, mediaUrls.length > 0 ? mediaUrls : null, mediaType]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Clean up uploaded files if error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// Serve uploaded files
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = router;