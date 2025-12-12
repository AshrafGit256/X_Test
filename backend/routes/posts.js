// Add at the beginning of your POST route
router.post('/', upload.array('media', 4), async (req, res) => {
  console.log('POST /api/posts received');
  console.log('Body:', req.body);
  console.log('Files:', req.files ? req.files.length : 0);
  
  try {
    const express = require('express');
    const router = express.Router();
    const { pool } = require('../db');
    const upload = require('../uploadConfig'); // Import upload config
    const path = require('path');
    const fs = require('fs');

    // Get all posts with media
    // Replace your existing GET / route with this:
    router.get('/', async (req, res) => {
      try {
        const result = await pool.query(`
          SELECT p.*, 
                EXISTS(SELECT 1 FROM post_likes pl 
                        WHERE pl.post_id = p.id 
                        AND pl.username = $1) as user_liked,
                EXISTS(SELECT 1 FROM retweets rt 
                        WHERE rt.post_id = p.id 
                        AND rt.username = $1) as user_retweeted
          FROM posts p
          WHERE p.parent_post_id IS NULL  -- Exclude replies from main feed
          ORDER BY p.created_at DESC
        `, [req.query.username || 'anonymous']);
        
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

    // Add these routes to your existing posts.js

    // Like a post
    router.post('/:id/like', async (req, res) => {
      try {
        const { id } = req.params;
        const { username } = req.body;
        
        // Check if already liked
        const check = await pool.query(
          'SELECT * FROM post_likes WHERE post_id = $1 AND username = $2',
          [id, username]
        );
        
        if (check.rows.length > 0) {
          // Unlike
          await pool.query(
            'DELETE FROM post_likes WHERE post_id = $1 AND username = $2',
            [id, username]
          );
          await pool.query(
            'UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1',
            [id]
          );
          res.json({ liked: false });
        } else {
          // Like
          await pool.query(
            'INSERT INTO post_likes (post_id, username) VALUES ($1, $2)',
            [id, username]
          );
          await pool.query(
            'UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1',
            [id]
          );
          res.json({ liked: true });
        }
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Retweet a post
    router.post('/:id/retweet', async (req, res) => {
      try {
        const { id } = req.params;
        const { username } = req.body;
        
        // Get original post
        const original = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
        if (original.rows.length === 0) {
          return res.status(404).json({ error: 'Post not found' });
        }
        
        const originalPost = original.rows[0];
        
        // Check if already retweeted
        const check = await pool.query(
          'SELECT * FROM retweets WHERE post_id = $1 AND username = $2',
          [id, username]
        );
        
        if (check.rows.length > 0) {
          // Undo retweet
          await pool.query(
            'DELETE FROM retweets WHERE post_id = $1 AND username = $2',
            [id, username]
          );
          await pool.query(
            'UPDATE posts SET retweets_count = retweets_count - 1 WHERE id = $1',
            [id]
          );
          // Also delete the retweet post if exists
          await pool.query(
            'DELETE FROM posts WHERE is_retweet = true AND original_post_id = $1 AND username = $2',
            [id, username]
          );
          res.json({ retweeted: false });
        } else {
          // Create retweet record
          await pool.query(
            'INSERT INTO retweets (post_id, username) VALUES ($1, $2)',
            [id, username]
          );
          
          // Update retweet count
          await pool.query(
            'UPDATE posts SET retweets_count = retweets_count + 1 WHERE id = $1',
            [id]
          );
          
          // Create retweet as a new post
          await pool.query(
            `INSERT INTO posts 
            (username, content, is_retweet, original_post_id, original_username, created_at) 
            VALUES ($1, $2, true, $3, $4, CURRENT_TIMESTAMP)`,
            [username, originalPost.content, id, originalPost.username]
          );
          
          res.json({ retweeted: true });
        }
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Reply to a post
    router.post('/:id/reply', async (req, res) => {
      try {
        const { id } = req.params;
        const { username, content } = req.body;
        
        // Check if parent post exists
        const parent = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
        if (parent.rows.length === 0) {
          return res.status(404).json({ error: 'Parent post not found' });
        }
        
        // Create reply
        const result = await pool.query(
          `INSERT INTO posts (username, content, parent_post_id) 
          VALUES ($1, $2, $3) RETURNING *`,
          [username, content, id]
        );
        
        // Update parent's reply count
        await pool.query(
          'UPDATE posts SET replies_count = replies_count + 1 WHERE id = $1',
          [id]
        );
        
        res.status(201).json(result.rows[0]);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Get post with interactions
    router.get('/:id/with-interactions', async (req, res) => {
      try {
        const { id } = req.params;
        
        const result = await pool.query(`
          SELECT p.*, 
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
                (SELECT COUNT(*) FROM retweets WHERE post_id = p.id) as retweets,
                (SELECT COUNT(*) FROM posts WHERE parent_post_id = p.id) as replies
          FROM posts p
          WHERE p.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Post not found' });
        }
        
        res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve uploaded files
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = router;
  } catch (err) {
    console.error('POST error:', err);
    res.status(500).json({ error: err.message });
  }
});
