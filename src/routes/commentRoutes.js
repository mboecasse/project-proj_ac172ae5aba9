// File: src/routes/commentRoutes.js
// Generated: 2025-10-16 09:24:49 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_02u3tk132lvl


const express = require('express');


const logger = require('../utils/logger');

const { Validator } = require('../middleware/validator');

const { authenticate, authorize } = require('../middleware/auth');

const { getComments, getCommentById, createComment, updateComment, deleteComment } = require('../controllers/commentController');


const router = express.Router();

// Initialize validator instance


const validator = new Validator();

/**
 * GET /posts/:postId/comments
 * Retrieve all comments for a specific post
 * @param {string} postId - MongoDB ObjectId of the post
 */
router.get('/posts/:postId/comments',
  validator.validateId('postId'),
  getComments
);

/**
 * POST /posts/:postId/comments
 * Create a new comment on a post
 * @param {string} postId - MongoDB ObjectId of the post
 * @body {string} content - Comment content (required)
 * @body {string} author - Comment author (required)
 */
router.post('/posts/:postId/comments',
  authenticate,
  validator.validateId('postId'),
  validator.validateComment(),
  createComment
);

/**
 * GET /comments/:id
 * Retrieve a single comment by ID
 * @param {string} id - MongoDB ObjectId of the comment
 */
router.get('/:id',
  validator.validateId('id'),
  getCommentById
);

/**
 * PUT /comments/:id
 * Update an existing comment
 * @param {string} id - MongoDB ObjectId of the comment
 * @body {string} content - Updated comment content (required)
 * @body {string} author - Updated comment author (required)
 */
router.put('/:id',
  authenticate,
  authorize('comment'),
  validator.validateId('id'),
  validator.validateComment(),
  updateComment
);

/**
 * DELETE /comments/:id
 * Delete a comment
 * @param {string} id - MongoDB ObjectId of the comment
 */
router.delete('/:id',
  authenticate,
  authorize('comment'),
  validator.validateId('id'),
  deleteComment
);

module.exports = router;
