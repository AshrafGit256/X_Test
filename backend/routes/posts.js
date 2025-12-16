// backend/routes/posts.js - LOCAL TESTING VERSION
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const upload = require('../uploadConfig'); // Make sure this exists
const path = require('path');
const fs = require('fs');

// Get all posts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create post WITH MEDIA UPLOAD
router.post('/', upload.array('media', 4), async (req, res) => {
  console.log('📤 POST /api/posts - Files received:', req.files ? req.files.length : 0);
  console.log('Body:', req.body);
  
  try {
    const { username, content } = req.body;
    const files = req.files || [];
    
    let mediaType = null;
    const mediaUrls = [];
    
    if (files.length > 0) {
      console.log('Processing files:', files.map(f => f.originalname));
      
      // Create local URLs
      files.forEach(file => {
        // Local URL - accessible from browser
        mediaUrls.push(`/api/posts/uploads/${file.filename}`);
      });
      
      // Determine media type
      const hasImages = files.some(f => f.mimetype.startsWith('image'));
      const hasVideos = files.some(f => f.mimetype.startsWith('video'));
      
      if (hasImages && hasVideos) mediaType = 'mixed';
      else if (hasImages) mediaType = 'image';
      else if (hasVideos) mediaType = 'video';
    }
    
    // Debug log
    console.log('Inserting with:', { 
      username: username || 'anonymous', 
      content, 
      mediaUrls, 
      mediaType 
    });
    
    // Insert into database
    const result = await pool.query(
      'INSERT INTO posts (username, content, media_urls, media_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [username || 'anonymous', content, mediaUrls.length > 0 ? mediaUrls : null, mediaType]
    );
    
    console.log('✅ Post created with ID:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
    
  } catch (err) {
    console.error('❌ POST error:', err.message);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log('Cleaned up:', file.path);
        } catch (e) {
          console.error('Failed to clean up:', e.message);
        }
      });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// Serve uploaded files locally
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = router;