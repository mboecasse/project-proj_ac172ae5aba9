// File: src/config/database.js
// Generated: 2025-10-16 09:21:19 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_l6puc6p52vi7


const config = require('./env.js');


const logger = require('../utils/logger');


const mongoose = require('mongoose');

async * All files must import mongoose from this file ONLY.
 *
 * Features:
 * - Singleton connection pattern
 * - Automatic retry logic with exponential backoff
 * - Connection state management
 * - Graceful shutdown handling
 * - Comprehensive event logging
 *
 * @module config/database
 */

// Connection state tracking

let isConnecting = false;

let isConnected = false;

let connectionPromise = null;

// Retry configuration


const MAX_RETRIES = 5;


const BASE_DELAY = 1000; // 1 second


const MAX_DELAY = 30000; // 30 seconds

/**
 * Mongoose connection options
 */


const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
  maxPoolSize: 10,
  minPoolSize: 2,
};

/**
 * Calculate exponential backoff delay
 * @param {number} retryCount - Current retry attempt number
 * @returns {number} Delay in milliseconds
 */


const calculateDelay = (retryCount) => {
  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
  return delay;
};

/**
 * Validate MongoDB connection URI
 * @param {string} uri - MongoDB connection string
 * @returns {boolean} True if valid
 */


const validateConnectionUri = (uri) => {
  if (!uri) {
    logger.error('MongoDB URI is not defined in environment variables');
    return false;
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    logger.error('Invalid MongoDB URI format', { uri: uri.substring(0, 20) + '...' });
    return false;
  }

  // Warn if using default localhost in production
  if (process.env.NODE_ENV === 'production' && uri.includes('localhost')) {
    logger.warn('Using localhost MongoDB connection in production environment');
  }

  return true;
};

/**
 * Mask sensitive information in connection string for logging
 * @param {string} uri - MongoDB connection string
 * @returns {string} Masked URI
 */


const maskConnectionString = (uri) => {
  try {
    const url = new URL(uri);
    if (url.password) {
      url.password = '****';
    }
    return url.toString();
  } catch (error) {
    return uri.substring(0, 20) + '...';
  }
};

/**
 * Connect to MongoDB with retry logic
 * @param {number} retryCount - Current retry attempt (default: 0)
 * @returns {Promise<void>}
 * @throws {Error} If connection fails after all retries
 */


const connectDB = async (retryCount = 0) => {
  // Return existing connection promise if already connecting
  if (isConnecting && connectionPromise) {
    logger.debug('Connection attempt already in progress, returning existing promise');
    return connectionPromise;
  }

  // Return immediately if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    logger.debug('Already connected to MongoDB');
    return Promise.resolve();
  }

  // Validate connection URI
  const mongoUri = config.mongodb?.uri || process.env.MONGODB_URI;
  if (!validateConnectionUri(mongoUri)) {
    throw new Error('Invalid or missing MongoDB connection URI');
  }

  isConnecting = true;

  connectionPromise = (async () => {
    try {
      const attemptNumber = retryCount + 1;
      logger.info(`Attempting to connect to MongoDB... (Attempt ${attemptNumber}/${MAX_RETRIES})`, {
        uri: maskConnectionString(mongoUri),
        attempt: attemptNumber,
      });

      await mongoose.connect(mongoUri, options);

      isConnected = true;
      isConnecting = false;

      const host = mongoose.connection.host;
      const dbName = mongoose.connection.name;

      logger.info('MongoDB connected successfully', {
        host,
        database: dbName,
        readyState: mongoose.connection.readyState,
      });

      return;
    } catch (error) {
      isConnecting = false;

      // Determine error type for better logging
      let errorType = 'Unknown';
      if (error.name === 'MongoNetworkError') {
        errorType = 'Network';
      } else if (error.name === 'MongoServerSelectionError') {
        errorType = 'Server Selection';
      } else if (error.name === 'MongoAuthenticationError') {
        errorType = 'Authentication';
      } else if (error.name === 'MongoTimeoutError') {
        errorType = 'Timeout';
      }

      logger.error(`MongoDB connection error (${errorType})`, {
        error: error.message,
        errorType,
        attempt: retryCount + 1,
        maxRetries: MAX_RETRIES,
      });

      // Check if we should retry
      if (retryCount < MAX_RETRIES - 1) {
        const delay = calculateDelay(retryCount);
        logger.info(`Retrying connection in ${delay / 1000}s...`, {
          nextAttempt: retryCount + 2,
          maxRetries: MAX_RETRIES,
        });

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));

        // Reset connection promise before retry
        connectionPromise = null;

        // Retry connection
        return connectDB(retryCount + 1);
      } else {
        const finalError = new Error(
          `Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${error.message}`
        );
        logger.error('Max connection retries exceeded', {
          attempts: MAX_RETRIES,
          lastError: error.message,
        });
        throw finalError;
      }
    }
  })();

  return connectionPromise;
};

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */


const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      isConnected = false;
      isConnecting = false;
      connectionPromise = null;
      logger.info('MongoDB connection closed successfully');
    }
  } catch (error) {
    logger.error('Error closing MongoDB connection', { error: error.message });
    throw error;
  }
};

/**
 * Get current connection state
 * @returns {Object} Connection state information
 */


const getConnectionState = () => {
  return {
    isConnected,
    isConnecting,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
};

// ============================================================================
// Connection Event Listeners
// ============================================================================

mongoose.connection.on('connected', () => {
  isConnected = true;
  logger.info('Mongoose connected event fired', {
    host: mongoose.connection.host,
    database: mongoose.connection.name,
  });
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error event', {
    error: err.message,
    readyState: mongoose.connection.readyState,
  });
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('Mongoose disconnected event fired', {
    readyState: mongoose.connection.readyState,
  });

  // Attempt reconnection if not intentional shutdown
  if (process.env.NODE_ENV !== 'test' && !isConnecting) {
    logger.info('Attempting automatic reconnection...');
    setTimeout(() => {
      if (!isConnected && !isConnecting) {
        connectDB().catch(err => {
          logger.error('Automatic reconnection failed', { error: err.message });
        });
      }
    }, 5000);
  }
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  logger.info('Mongoose reconnected successfully', {
    host: mongoose.connection.host,
  });
});

mongoose.connection.on('close', () => {
  isConnected = false;
  logger.info('Mongoose connection closed');
});

// ============================================================================
// Graceful Shutdown Handlers
// ============================================================================

/**
 * Handle graceful shutdown
 * @param {string} signal - Signal that triggered shutdown
 */


const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received, initiating graceful shutdown...`);

  try {
    await mongoose.connection.close();
    isConnected = false;
    isConnecting = false;
    connectionPromise = null;

    logger.info('MongoDB connection closed gracefully', { signal });
    process.exit(0);
  } catch (err) {
    logger.error('Error during graceful shutdown', {
      signal,
      error: err.message,
    });
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', {
    error: err.message,
    stack: err.stack,
  });
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionState,
  mongoose,
};
