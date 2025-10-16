// File: src/routes/index.js
// Generated: 2025-10-16 09:20:23 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_xdekduz5gnoe


const commentRoutes = require('./commentRoutes');


const express = require('express');


const healthRoutes = require('./healthRoutes');


const logger = require('../utils/logger');


const postRoutes = require('./postRoutes');


const router = express.Router();

// Import route modules

/**
 * Health Check Route
 * GET /health
 * Returns API health status for monitoring and deployment verification
 */
router.use('/health', healthRoutes);

/**
 * Posts API Routes
 * Mounts all post-related endpoints at /api/posts
 * Includes: GET /, GET /:id, POST /, PUT /:id, DELETE /:id
 */
router.use('/api/posts', postRoutes);

/**
 * Comments API Routes
 * Mounts all comment-related endpoints at /api/comments
 * Includes: GET /, GET /:id, POST /, PUT /:id, DELETE /:id
 * Supports optional ?postId query parameter for filtering
 */
router.use('/api/comments', commentRoutes);

// Log route registration
logger.info('Routes registered successfully', {
  routes: ['/health', '/api/posts', '/api/comments']
});

module.exports = router;
