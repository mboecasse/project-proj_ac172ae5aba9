// File: src/utils/apiResponse.js
// Generated: 2025-10-16 09:21:17 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_2bhn4l1mielh

* - Success: { success: true, data: any, message: string, statusCode: number }
 * - Error: { success: false, data: null, message: string, statusCode: number, errors?: any }
 */

/**
 * HTTP Status Code Constants
 * Common status codes used throughout the application
 */


const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */


function sanitizeString(input) {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * ApiResponse Class
 * Static methods for sending standardized API responses
 */
class ApiResponse {
  /**
   * Send a success response
   *
   * @param {Object} res - Express response object
   * @param {*} data - Response data (can be object, array, or null)
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   * @returns {Object} Express response
   *
   * @example
   * ApiResponse.success(res, posts, 'Posts retrieved successfully');
   * ApiResponse.success(res, newPost, 'Post created successfully', 201);
   * ApiResponse.success(res, null, 'Post deleted successfully');
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    if (!res || typeof res.status !== 'function') {
      throw new Error('Invalid response object provided to ApiResponse.success');
    }

    if (typeof statusCode !== 'number' || statusCode < 100 || statusCode > 599) {
      statusCode = 200;
    }

    const sanitizedMessage = sanitizeString(message);

    return res.status(statusCode).json({
      success: true,
      data: data,
      message: sanitizedMessage,
      statusCode: statusCode
    });
  }

  /**
   * Send an error response
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {*} errors - Additional error details (optional, for validation errors)
   * @returns {Object} Express response
   *
   * @example
   * ApiResponse.error(res, 'Post not found', 404);
   * ApiResponse.error(res, 'Validation failed', 400, { title: 'Title is required' });
   * ApiResponse.error(res, 'Internal server error', 500);
   */
  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    if (!res || typeof res.status !== 'function') {
      throw new Error('Invalid response object provided to ApiResponse.error');
    }

    if (typeof statusCode !== 'number' || statusCode < 100 || statusCode > 599) {
      statusCode = 500;
    }

    const sanitizedMessage = sanitizeString(message);

    const response = {
      success: false,
      data: null,
      message: sanitizedMessage,
      statusCode: statusCode
    };

    if (errors !== null && errors !== undefined) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a created response (201)
   * Convenience method for resource creation
   *
   * @param {Object} res - Express response object
   * @param {*} data - Created resource data
   * @param {string} message - Success message
   * @returns {Object} Express response
   *
   * @example
   * ApiResponse.created(res, newPost, 'Post created successfully');
   */
  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, STATUS_CODES.CREATED);
  }

  /**
   * Send a no content response (204)
   * Used for successful operations with no response body
   *
   * @param {Object} res - Express response object
   * @returns {Object} Express response
   *
   * @example
   * ApiResponse.noContent(res);
   */
  static noContent(res) {
    if (!res || typeof res.status !== 'function') {
      throw new Error('Invalid response object provided to ApiResponse.noContent');
    }

    return res.status(STATUS_CODES.NO_CONTENT).send();
  }

  /**
   * Send a bad request error (400)
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {*} errors - Validation errors (optional)
   * @returns {Object} Express response
   *
   * @example
   * ApiResponse.badRequest(res, 'Invalid input data');
   * ApiResponse.badRequest(res, 'Validation failed', validationErrors);
   */
  static badRequest(res, message = 'Bad request', errors = null) {
    return this.error(res, message, STATUS_CODES.BAD_REQUEST, errors);
  }

  /**
   * Send an unauthorized error (401)
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} Express response
   *
   * @example
   * ApiResponse.unauthorized(res, 'Invalid credentials');
   */
  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, STATUS_CODES.UNAUTHORIZED);
  }

  /**
   * Send a forbidden error (403)
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} Express response
   *
   * @example
   * ApiResponse.forbidden(res, 'Access denied');
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, STATUS_CODES.FORBIDDEN);
  }

  /**
   * Send a not found error (404)
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} Express response
   *
   * @example
   * ApiResponse.notFound(res, 'Post not found');
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, STATUS_CODES.NOT_FOUND);
  }

  /**
   * Send a conflict error (409)
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} Express response
   *
   * @example
   * ApiResponse.conflict(res, 'Resource already exists');
   */
  static conflict(res, message = 'Conflict') {
    return this.error(res, message, STATUS_CODES.CONFLICT);
  }

  /**
   * Send an unprocessable entity error (422)
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {*} errors - Validation errors (optional)
   * @returns {Object} Express response
   *
   * @example
   * ApiResponse.unprocessableEntity(res, 'Validation failed', errors);
   */
  static unprocessableEntity(res, message = 'Unprocessable entity', errors = null) {
    return this.error(res, message, STATUS_CODES.UNPROCESSABLE_ENTITY, errors);
  }

  /**
   * Send an internal server error (500)
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} Express response
   *
   * @example
   * ApiResponse.internalServerError(res, 'Something went wrong');
   */
  static internalServerError(res, message = 'Internal server error') {
    return this.error(res, message, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }

  /**
   * Send a service unavailable error (503)
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} Express response
   *
   * @example
   * ApiResponse.serviceUnavailable(res, 'Service temporarily unavailable');
   */
  static serviceUnavailable(res, message = 'Service unavailable') {
    return this.error(res, message, STATUS_CODES.SERVICE_UNAVAILABLE);
  }
}

module.exports = ApiResponse;
module.exports.STATUS_CODES = STATUS_CODES;
