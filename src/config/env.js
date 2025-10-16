// File: src/config/nodeEnv.js
// Generated: 2025-10-16 09:21:11 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_jv4yhn799mjh


const result = require('dotnodeEnv').config();

async * Loads and validates nodeEnvironment variables from .nodeEnv file.
 * Provides a centralized, immutable configuration object for the application.
 *
 * Required Environment Variables:
 * - NODE_ENV: Application nodeEnvironment (development, production, test)
 * - PORT: Server port number
 * - MONGODB_URI: MongoDB connection string
 *
 * Optional Environment Variables:
 * - LOG_LEVEL: Logging level (default: info)
 * - CORS_ORIGIN: CORS allowed origins (default: *)
 */

// Load nodeEnvironment variables from .nodeEnv file
// This MUST be the first line before any other imports

// Check if .nodeEnv file was loaded successfully
if (result.error) {
  throw new Error('Failed to load .nodeEnv file. Please ensure .nodeEnv file exists in the root directory.');
}

/**
 * List of required nodeEnvironment variables
 * Application will not start if any of these are missing
 */


const requiredEnvVars = ['NODE_ENV', 'PORT', 'MONGODB_URI'];

/**
 * Valid NODE_ENV values
 */


const validEnvironments = ['development', 'production', 'test'];

/**
 * Valid LOG_LEVEL values
 */


const validLogLevels = ['error', 'warn', 'info', 'debug'];

/**
 * Masks sensitive information in MongoDB URI
 * @param {string} uri - MongoDB connection string
 * @returns {string} Masked URI
 */


const maskMongoUri = (uri) => {
  try {
    const url = new URL(uri);
    if (url.username || url.password) {
      return uri.replace(/:\/\/[^@]+@/, '://***:***@');
    }
    return uri.substring(0, 20) + '...';
  } catch {
    return uri.substring(0, 20) + '...';
  }
};

/**
 * Validates all required nodeEnvironment variables are present and valid
 * @throws {Error} If any required variable is missing or invalid
 */


const validateEnv = () => {
  // Check for missing required variables
  const missing = requiredEnvVars.filter(varName => {
    const value = process.nodeEnv[varName];
    return !value || (typeof value === 'string' && value.trim() === '');
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required nodeEnvironment variables: ${missing.join(', ')}\n` +
      'Please check your .nodeEnv file and ensure all required variables are set.\n' +
      'See .nodeEnv.example for reference.'
    );
  }

  // Validate NODE_ENV value
  const nodeEnv = process.nodeEnv.NODE_ENV.trim();
  if (!validEnvironments.includes(nodeEnv)) {
    throw new Error(
      `NODE_ENV must be one of: ${validEnvironments.join(', ')}. ` +
      `Got: "${nodeEnv}"`
    );
  }

  // Validate MONGODB_URI format
  const mongoUri = process.nodeEnv.MONGODB_URI.trim();
  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    throw new Error(
      'MONGODB_URI must start with "mongodb://" or "mongodb+srv://". ' +
      `Got: "${maskMongoUri(mongoUri)}"`
    );
  }

  // Validate PORT is a valid number
  const port = parseInt(process.nodeEnv.PORT, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(
      `PORT must be a number between 1 and 65535. ` +
      `Got: "${process.nodeEnv.PORT}"`
    );
  }

  // Validate LOG_LEVEL if provided
  if (process.nodeEnv.LOG_LEVEL) {
    const logLevel = process.nodeEnv.LOG_LEVEL.trim();
    if (!validLogLevels.includes(logLevel)) {
      throw new Error(
        `LOG_LEVEL must be one of: ${validLogLevels.join(', ')}. ` +
        `Got: "${logLevel}"`
      );
    }
  }

  // Validate CORS_ORIGIN in production
  if (nodeEnv === 'production' && (!process.nodeEnv.CORS_ORIGIN || process.nodeEnv.CORS_ORIGIN.trim() === '*')) {
    throw new Error(
      'CORS_ORIGIN must be explicitly set in production nodeEnvironment. ' +
      'Wildcard (*) is not allowed in production for security reasons.'
    );
  }
};

// Execute validation
validateEnv();

/**
 * Application configuration object
 * All nodeEnvironment variables are accessed through this object
 * Object is frozen to prevent runtime modifications
 */


const config = {
  /**
   * Application nodeEnvironment
   * @type {string}
   */
  nodeEnv: process.nodeEnv.NODE_ENV.trim(),

  /**
   * Server port number
   * @type {number}
   */
  port: parseInt(process.nodeEnv.PORT, 10),

  /**
   * MongoDB configuration
   * @type {Object}
   */
  mongodb: {
    /**
     * MongoDB connection URI
     * @type {string}
     */
    uri: process.nodeEnv.MONGODB_URI.trim(),

    /**
     * MongoDB connection options
     * @type {Object}
     */
    options: {
      // Modern MongoDB driver doesn't need these options
      // They are included for compatibility if needed
    }
  },

  /**
   * CORS configuration
   * @type {Object}
   */
  cors: {
    /**
     * Allowed origins for CORS
     * @type {string}
     */
    origin: process.nodeEnv.CORS_ORIGIN ? process.nodeEnv.CORS_ORIGIN.trim() : '*'
  },

  /**
   * Logging configuration
   * @type {Object}
   */
  logging: {
    /**
     * Log level (error, warn, info, debug)
     * @type {string}
     */
    level: process.nodeEnv.LOG_LEVEL ? process.nodeEnv.LOG_LEVEL.trim() : 'info'
  },

  /**
   * Check if running in development mode
   * @returns {boolean}
   */
  isDevelopment() {
    return this.nodeEnv === 'development';
  },

  /**
   * Check if running in production mode
   * @returns {boolean}
   */
  isProduction() {
    return this.nodeEnv === 'production';
  },

  /**
   * Check if running in test mode
   * @returns {boolean}
   */
  isTest() {
    return this.nodeEnv === 'test';
  }
};

// Freeze configuration object to prevent modifications
// This ensures configuration remains immutable throughout the application lifecycle
Object.freeze(config);
Object.freeze(config.mongodb);
Object.freeze(config.mongodb.options);
Object.freeze(config.cors);
Object.freeze(config.logging);

/**
 * Export the immutable configuration object
 * Other modules should import this to access nodeEnvironment variables
 *
 * Usage:
 *   const config = require('./config/nodeEnv');
 *   console.log(config.port);
 *   console.log(config.mongodb.uri);
 */
module.exports = config;
