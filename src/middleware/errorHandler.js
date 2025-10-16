// File: src/middleware/errorHandler.js
// Generated: 2025-10-16 09:23:19 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_agamf1mudf2x


const ApiResponse = require('../utils/apiResponse');


const logger = require('../utils/logger');

/**
 * Sanitize error value to prevent sensitive data exposure
 * @param {*} value - Value to sanitize
 * @returns {string} Sanitized value
 */


const sanitizeValue = (value) => {
  if (value === null || value === undefined) {
    return '[redacted]';
  }
  return '[redacted]';
};

/**
 * Sanitize error context to remove sensitive data
 * @param {Object} context - Error context
 * @param {boolean} isServerError - Whether this is a server error (5xx)
 * @returns {Object} Sanitized context
 */


const sanitizeErrorContext = (context, isServerError) => {
  const sanitized = {
    method: context.method,
    path: context.path,
    statusCode: context.statusCode,
    name: context.name,
    code: context.code
  };

  // Only include stack traces for server errors (5xx)
  if (isServerError) {
    sanitized.stack = context.stack;
    sanitized.message = context.message;
    sanitized.userId = context.userId;
    sanitized.ip = context.ip;
  }

  return sanitized;
};

/**
 * Error handler middleware
 * Must be registered as the LAST middleware in Express app
 *
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */


const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = null;

  const isServerError = statusCode >= 500;

  // Log error with request context
  const errorContext = {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.userId || req.user?.id || req.user?._id,
    statusCode: statusCode,
    name: err.name,
    code: err.code
  };

  // Sanitize context based on error type
  const sanitizedContext = sanitizeErrorContext(errorContext, isServerError);

  // Log based on error severity
  if (isServerError) {
    logger.error('Server error occurred', sanitizedContext);
  } else {
    logger.warn('Client error occurred', sanitizedContext);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
      // Removed value field to prevent sensitive data exposure
    }));

    // Don't log validation error details that may contain sensitive data
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    // Never expose the actual value, even in non-production
    message = `Invalid ${err.path} format`;
  }

  // Handle MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0];

    message = field
      ? `Duplicate value for ${field}`
      : 'Duplicate key error';

    // In production, don't expose field details
    if (process.env.NODE_ENV === 'production') {
      message = 'Resource already exists';
    }

    errors = [{
      field: field || 'unknown',
      message: `${field || 'Field'} already exists`
      // Removed value field to prevent sensitive data exposure
    }];
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Handle Mongoose Document Not Found Error
  if (err.name === 'DocumentNotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Handle custom operational errors
  if (err.isOperational) {
    statusCode = err.statusCode || 500;
    message = err.message;
  }

  // Sanitize error messages in production
  if (process.env.NODE_ENV === 'production') {
    // Hide internal error details for 500 errors
    if (statusCode === 500) {
      message = 'Internal server error';
      // Don't include stack trace or detailed error info
    }

    // Sanitize MongoDB-specific details
    if (message.includes('E11000')) {
      message = 'Duplicate resource';
    }

    // Remove file paths and internal details
    message = message.replace(/\/[\w\/.-]+/g, '');
  }

  // Prepare response object
  const response = {
    success: false,
    message: message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && isServerError && {
      error: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    })
  };

  // Send error response using ApiResponse utility
  return res.status(statusCode).json(response);
};

/**
 * Handle 404 Not Found errors
 * This should be registered before the error handler
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */


const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;

  logger.warn('Route not found', {
    method: req.method,
    path: req.originalUrl
    // Removed IP to prevent unnecessary PII logging for 404s
  });

  next(error);
};

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handler
 *
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */


const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};
