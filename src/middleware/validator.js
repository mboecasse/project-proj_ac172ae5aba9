// File: src/middleware/validator.js
// Generated: 2025-10-16 09:23:44 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_x3bjf8bozmbp


const ApiResponse = require('../utils/apiResponse');

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation rules for creating a new post
 *
 * @type {Array}
 * @example
 * router.post('/posts', validateCreatePost, handleValidationErrors, createPost);
 */


const validateCreatePost = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),

  body('author')
    .trim()
    .notEmpty()
    .withMessage('Author is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters')
];

/**
 * Validation rules for updating a post
 * All fields are optional, but at least one field must be provided
 *
 * @type {Array}
 * @example
 * router.put('/posts/:postId', validateUpdatePost, handleValidationErrors, updatePost);
 */


const validateUpdatePost = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),

  body('content')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),

  body('author')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),

  body()
    .custom((value, { req }) => {
      const hasAtLeastOneField = req.body.title || req.body.content || req.body.author;
      if (!hasAtLeastOneField) {
        throw new Error('At least one field (title, content, or author) must be provided for update');
      }
      return true;
    })
];

/**
 * Validation rules for creating a new comment
 *
 * @type {Array}
 * @example
 * router.post('/comments', validateCreateComment, handleValidationErrors, createComment);
 */


const validateCreateComment = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 3, max: 500 })
    .withMessage('Comment content must be between 3 and 500 characters'),

  body('author')
    .trim()
    .notEmpty()
    .withMessage('Author is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),

  body('postId')
    .notEmpty()
    .withMessage('Post ID is required')
    .isMongoId()
    .withMessage('Invalid post ID format')
];

/**
 * Validation rules for post ID parameter
 *
 * @type {Array}
 * @example
 * router.get('/posts/:postId', validatePostId, handleValidationErrors, getPost);
 */


const validatePostId = [
  param('postId')
    .notEmpty()
    .withMessage('Post ID is required')
    .isMongoId()
    .withMessage('Invalid post ID format')
];

/**
 * Validation rules for comment ID parameter
 *
 * @type {Array}
 * @example
 * router.get('/comments/:commentId', validateCommentId, handleValidationErrors, getComment);
 */


const validateCommentId = [
  param('commentId')
    .notEmpty()
    .withMessage('Comment ID is required')
    .isMongoId()
    .withMessage('Invalid comment ID format')
];

/**
 * Validation rules for pagination query parameters
 *
 * @type {Array}
 * @example
 * router.get('/posts', validatePagination, handleValidationErrors, getAllPosts);
 */


const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

/**
 * Validation rules for search/filter query parameters
 * Sanitizes search terms to prevent injection attacks
 *
 * @type {Array}
 * @example
 * router.get('/posts/search', validateSearch, handleValidationErrors, searchPosts);
 */


const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters'),

  query('author')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author filter must be between 2 and 100 characters'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title', 'author'])
    .withMessage('Invalid sort field'),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either asc or desc')
];

/**
 * Middleware to handle validation errors
 * Must be used after validation rule chains
 * Returns standardized error response if validation fails
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Error response or calls next()
 *
 * @example
 * router.post('/posts',
 *   validateCreatePost,
 *   handleValidationErrors,
 *   createPost
 * );
 */


const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param || err.path,
      message: err.msg,
      value: err.value
    }));

    return res.status(ApiResponse.STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  next();
};

/**
 * Combined validation for post routes
 * Validates both postId param and request body
 *
 * @type {Array}
 * @example
 * router.put('/posts/:postId', validatePostUpdate, handleValidationErrors, updatePost);
 */


const validatePostUpdate = [
  ...validatePostId,
  ...validateUpdatePost
];

/**
 * Combined validation for comment creation with post reference
 *
 * @type {Array}
 * @example
 * router.post('/posts/:postId/comments', validateCommentCreate, handleValidationErrors, createComment);
 */


const validateCommentCreate = [
  ...validatePostId,
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 3, max: 500 })
    .withMessage('Comment content must be between 3 and 500 characters'),

  body('author')
    .trim()
    .notEmpty()
    .withMessage('Author is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters')
];

/**
 * Validation for updating a comment
 *
 * @type {Array}
 * @example
 * router.put('/comments/:commentId', validateCommentUpdate, handleValidationErrors, updateComment);
 */


const validateCommentUpdate = [
  ...validateCommentId,
  body('content')
    .optional()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Comment content must be between 3 and 500 characters'),

  body('author')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),

  body()
    .custom((value, { req }) => {
      const hasAtLeastOneField = req.body.content || req.body.author;
      if (!hasAtLeastOneField) {
        throw new Error('At least one field (content or author) must be provided for update');
      }
      return true;
    })
];


const Validator = {
  validateCreatePost,
  validateUpdatePost,
  validateCreateComment,
  validatePostId,
  validateCommentId,
  validatePagination,
  validateSearch,
  handleValidationErrors,
  validatePostUpdate,
  validateCommentCreate,
  validateCommentUpdate
};

module.exports = { Validator };
