// File: src/utils/logger.js
// Generated: 2025-10-16 09:21:35 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_t08v7k9aicje


const fs = require('fs');


const path = require('path');


const winston = require('winston');

async * All files MUST import from here - NO console.log anywhere.
 *
 * Features:
 * - Multiple log levels (error, warn, info, debug)
 * - Console transport for development (colorized)
 * - File transports for production (error.log, combined.log)
 * - Custom formatting with timestamps
 * - Metadata support for structured logging
 * - Log rotation to prevent disk space issues
 *
 * Usage in other files:
 * const logger = require('../utils/logger');
 * logger.info('Message', { userId: '123', action: 'login' });
 * logger.error('Error occurred', { error: err.message, stack: err.stack });
 */

// Ensure logs directory exists


const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom format for console output (development)
 * Includes colorization and pretty-printing
 */


const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let metaString = '';
    if (Object.keys(meta).length > 0) {
      // Remove empty objects and format metadata
      const filteredMeta = Object.keys(meta).reduce((acc, key) => {
        if (meta[key] !== undefined && meta[key] !== null && meta[key] !== '') {
          acc[key] = meta[key];
        }
        return acc;
      }, {});

      if (Object.keys(filteredMeta).length > 0) {
        metaString = '\n' + JSON.stringify(filteredMeta, null, 2);
      }
    }
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

/**
 * Custom format for file output (production)
 * JSON format for easy parsing and analysis
 */


const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Create the Winston logger instance
 * This is the ONLY logger instance in the application
 */


const logger = winston.createLogger({
  // Set log level based on environment
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Use npm log levels (error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6)
  levels: winston.config.npm.levels,

  // Default format for all transports
  format: fileFormat,

  // Default metadata added to all logs
  defaultMeta: { service: 'blog-api' },

  // File transports (always active)
  transports: [
    // Error log - only errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),

    // Combined log - all levels
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],

  // Don't exit on error
  exitOnError: false
});

/**
 * Add console transport for development
 * Provides colorized, human-readable output
 */
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true
  }));
}

/**
 * Handle uncaught exceptions and unhandled rejections
 * Log them before the process exits
 */
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'exceptions.log'),
    maxsize: 5242880,
    maxFiles: 5
  })
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'rejections.log'),
    maxsize: 5242880,
    maxFiles: 5
  })
);

/**
 * Stream for Morgan HTTP request logging
 * Allows Morgan to write to Winston instead of console
 *
 * Usage in app.js:
 * const morgan = require('morgan');
 * const logger = require('./utils/logger');
 * app.use(morgan('combined', { stream: logger.stream }));
 */
logger.stream = {
  write: (message) => {
    // Remove trailing newline that Morgan adds
    logger.info(message.trim());
  }
};

/**
 * Helper method to log HTTP requests
 * Can be used directly in middleware
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
logger.logRequest = (req, res) => {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.userId || req.user?._id
  });
};

/**
 * Helper method to log HTTP responses
 * Can be used in response middleware
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {number} responseTime - Response time in ms
 */
logger.logResponse = (req, res, statusCode, responseTime) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  logger[level]('HTTP Response', {
    method: req.method,
    path: req.path,
    statusCode,
    responseTime: `${responseTime}ms`,
    userId: req.userId || req.user?._id
  });
};

/**
 * Helper method to log database operations
 * Provides consistent format for DB logs
 *
 * @param {string} operation - Database operation (find, create, update, delete)
 * @param {string} collection - Collection/table name
 * @param {Object} metadata - Additional metadata
 */
logger.logDbOperation = (operation, collection, metadata = {}) => {
  logger.debug('Database Operation', {
    operation,
    collection,
    ...metadata
  });
};

/**
 * Helper method to log authentication events
 * Tracks login, logout, token refresh, etc.
 *
 * @param {string} event - Auth event type
 * @param {Object} metadata - Additional metadata
 */
logger.logAuth = (event, metadata = {}) => {
  logger.info('Authentication Event', {
    event,
    ...metadata
  });
};

// Export the single logger instance
module.exports = logger;
