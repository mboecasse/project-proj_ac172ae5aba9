// File: src/validators/commentValidator.js
// Generated: 2025-10-16 09:20:51 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_l1pgzjgm0fp4


const { body, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 * Returns 400 with error details if validation fails
 */


const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Validation rules for creating a new comment
 *
 * Validates:
 * - content: Required, 1-1000 characters after trimming, sanitized (no HTML encoding)
 * - author: Required, 2-100 characters after trimming, sanitized (no HTML encoding)
 * - postId: Required, valid MongoDB ObjectId format
 *
 * Note: HTML escaping should be done at rendering time, not during validation.
 * Use handleValidationErrors middleware after these rules to check for errors.
 */


const createCommentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content must be between 1 and 1000 characters')
    .customSanitizer(value => {
      // Basic sanitization without HTML encoding
      // Remove null bytes and control characters except newlines/tabs
      return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }),

  body('author')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters')
    .customSanitizer(value => {
      // Basic sanitization without HTML encoding
      return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }),

  body('postId')
    .trim()
    .notEmpty()
    .withMessage('Post ID is required')
    .isMongoId()
    .withMessage('Invalid post ID format')
];

/**
 * Validation rules for updating an existing comment
 *
 * Validates:
 * - content: Required, 1-1000 characters after trimming, sanitized (no HTML encoding)
 *
 * Note: Author and postId cannot be changed after creation.
 * Use handleValidationErrors middleware after these rules to check for errors.
 */


const updateCommentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content must be between 1 and 1000 characters')
    .customSanitizer(value => {
      // Basic sanitization without HTML encoding
      return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    })
];

module.exports = {
  createCommentValidation,
  updateCommentValidation,
  handleValidationErrors
};
