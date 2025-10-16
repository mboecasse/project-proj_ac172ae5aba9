// File: src/routes/postRoutes.js
// Generated: 2025-10-16 09:24:45 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_kcsoctum1gxx


const express = require('express');

const { Validator } = require('../middleware/validator');

const { authenticate, authorize } = require('../middleware/auth');

const { getPosts, getPostById, createPost, updatePost, deletePost } = require('../controllers/postController');

const { rateLimiter } = require('../middleware/rateLimiter');


const router = express.Router();

/**
 * GET /
 * Retrieve all posts
 */
router.get('/', getPosts);

/**
 * GET /:id
 * Retrieve a single post by ID
 */
router.get('/:id', Validator.validatePostId, getPostById);

/**
 * POST /
 * Create a new post
 * Validates request body before processing
 */
router.post('/', authenticate, rateLimiter, Validator.validatePost, createPost);

/**
 * PUT /:id
 * Update an existing post
 * Validates both ID and request body
 */
router.put('/:id', authenticate, authorize, rateLimiter, Validator.validatePostId, Validator.validatePost, updatePost);

/**
 * DELETE /:id
 * Delete a post by ID
 */
router.delete('/:id', authenticate, authorize, rateLimiter, Validator.validatePostId, deletePost);

module.exports = router;
