// File: src/validators/postValidator.js
// Generated: 2025-10-16 09:21:23 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_2w4woeackpwu


const logger = require('../utils/logger');

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 * Formats and returns validation errors in consistent format
 */


const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));

    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: formattedErrors
    });

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: formattedErrors
    });
  }

  next();
};

/**
 * Validation rules for creating a new post
 * Validates: title (required, 3-200 chars), content (required, min 10 chars), status (optional, enum)
 */


const createPostValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters')
    .escape(),

  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 10 }).withMessage('Content must be at least 10 characters')
    .escape(),

  body('status')
    .optional()
    .trim()
    .isIn(['draft', 'published']).withMessage('New posts can only be draft or published')
    .escape(),

  handleValidationErrors
];

/**
 * Validation rules for updating an existing post
 * Validates: title (optional, 3-200 chars), content (optional, min 10 chars), status (optional, enum)
 * At least one field must be provided
 */


const updatePostValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Post ID is required')
    .isMongoId().withMessage('Invalid post ID format'),

  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty if provided')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters')
    .escape(),

  body('content')
    .optional()
    .trim()
    .notEmpty().withMessage('Content cannot be empty if provided')
    .isLength({ min: 10 }).withMessage('Content must be at least 10 characters')
    .escape(),

  body('status')
    .optional()
    .trim()
    .isIn(['draft', 'published', 'archived']).withMessage('Status must be draft, published, or archived')
    .escape(),

  body().custom((value, { req }) => {
    const hasTitle = req.body.title !== undefined;
    const hasContent = req.body.content !== undefined;
    const hasStatus = req.body.status !== undefined;

    if (!hasTitle && !hasContent && !hasStatus) {
      throw new Error('At least one field (title, content, or status) must be provided');
    }

    return true;
  }),

  handleValidationErrors
];

/**
 * Validation rules for status transition updates
 * Validates status transitions and business rules
 */


const updatePostStatusValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Post ID is required')
    .isMongoId().withMessage('Invalid post ID format'),

  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['draft', 'published', 'archived']).withMessage('Status must be draft, published, or archived')
    .custom((newStatus, { req }) => {
      // Status transition validation logic
      // Note: Current status should be validated in service layer with DB lookup
      // This validator only checks format and valid enum values

      const validStatuses = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid status value');
      }

      return true;
    })
    .escape(),

  handleValidationErrors
];

/**
 * Validation rules for post ID parameter
 * Used in routes that require valid MongoDB ObjectId
 */


const postIdValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Post ID is required')
    .isMongoId().withMessage('Invalid post ID format'),

  handleValidationErrors
];

/**
 * Validation rules for querying posts
 * Validates query parameters for filtering and pagination
 */


const queryPostsValidation = [
  query('status')
    .optional()
    .trim()
    .isIn(['draft', 'published', 'archived']).withMessage('Status must be draft, published, or archived')
    .escape(),

  query('page')
    .optional()
    .trim()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .trim()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('sort')
    .optional()
    .trim()
    .isIn(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'title', '-title']).withMessage('Invalid sort field')
    .escape(),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters')
    .escape(),

  handleValidationErrors
];

/**
 * Validation rules for deleting a post
 * Validates post ID parameter
 */


const deletePostValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Post ID is required')
    .isMongoId().withMessage('Invalid post ID format'),

  handleValidationErrors
];

/**
 * Custom validator for status transitions
 * Can be used in service layer to validate business rules
 *
 * @param {string} currentStatus - Current post status
 * @param {string} newStatus - Desired new status
 * @returns {Object} - { valid: boolean, message: string }
 */


const validateStatusTransition = (currentStatus, newStatus) => {
  // Define invalid transitions
  const invalidTransitions = {
    'draft': ['archived'],
    'archived': ['draft']
  };

  // Check if transition is invalid
  if (invalidTransitions[currentStatus].includes(newStatus)) {
    return {
      valid: false,
      message: `Cannot transition post from ${currentStatus} to ${newStatus}. Valid transitions from ${currentStatus}: ${getValidTransitions(currentStatus).join(', ')}`
    };
  }

  return {
    valid: true,
    message: 'Status transition is valid'
  };
};

/**
 * Get valid status transitions for a given status
 *
 * @param {string} status - Current status
 * @returns {Array<string>} - Array of valid target statuses
 */


const getValidTransitions = (status) => {
  const transitions = {
    'draft': ['published'],
    'published': ['archived'],
    'archived': ['published']
  };

  return transitions[status] || [];
};

/**
 * Validation rules for bulk operations
 * Validates array of post IDs
 */


const bulkPostValidation = [
  body('postIds')
    .isArray({ min: 1 }).withMessage('postIds must be a non-empty array')
    .custom((postIds) => {
      if (!postIds.every(id => typeof id === 'string')) {
        throw new Error('All post IDs must be strings');
      }
      return true;
    }),

  body('postIds.*')
    .isMongoId().withMessage('Invalid post ID format in array'),

  handleValidationErrors
];

module.exports = {
  createPostValidation,
  updatePostValidation,
  updatePostStatusValidation,
  postIdValidation,
  queryPostsValidation,
  deletePostValidation,
  bulkPostValidation,
  handleValidationErrors,
  validateStatusTransition,
  getValidTransitions
};
