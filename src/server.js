// File: src/server.js
// Generated: 2025-10-16 09:26:25 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_m2eqru29jlmf


const app = require('./app');


const config = require('./config/env');


const logger = require('./utils/logger');

const { connectDB, disconnectDB } = require('./config/database');


let server;

let isShuttingDown = false;

/**
 * Start the HTTP server
 * Connects to database first, then starts listening
 */


const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('Database connected successfully');

    // Start HTTP server
    server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`, {
        port: config.port,
        environment: config.nodeEnv,
        nodeVersion: process.version
      });
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`, { error: error.message });
      } else {
        logger.error('Server error occurred', { error: error.message });
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 * Closes server and database connections cleanly
 *
 * @param {string} signal - The signal that triggered shutdown (SIGTERM, SIGINT, etc.)
 */


const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal', { signal });
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} signal received. Starting graceful shutdown...`, { signal });

  // Set shutdown timeout to prevent hanging
  const shutdownTimeout = setTimeout(() => {
    logger.error('Forced shutdown due to timeout (10 seconds exceeded)');
    process.exit(1);
  }, 10000);

  try {
    if (server) {
      // Stop accepting new connections
      server.close(() => {
        logger.info('HTTP server closed - no longer accepting connections');

        // Close database connections
        disconnectDB()
          .then(() => {
            logger.info('Database connections closed successfully');
            clearTimeout(shutdownTimeout);
            logger.info('Graceful shutdown completed successfully');
            process.exit(0);
          })
          .catch((dbError) => {
            logger.error('Error closing database connections', {
              error: dbError.message,
              stack: dbError.stack
            });
            clearTimeout(shutdownTimeout);
            process.exit(1);
          });
      });

      // If there are active connections, log them
      server.getConnections((err, count) => {
        if (err) {
          logger.error('Error getting connection count', { error: err.message });
        } else {
          logger.info(`Waiting for ${count} active connection(s) to close...`, {
            activeConnections: count
          });
        }
      });
    } else {
      // No server to close, just disconnect database
      await disconnectDB();
      logger.info('Database connections closed successfully');
      clearTimeout(shutdownTimeout);
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error during graceful shutdown', {
      error: error.message,
      stack: error.stack
    });
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
};

/**
 * Handle uncaught exceptions
 * Log error and trigger graceful shutdown
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception - Critical error occurred', {
    error: error.message,
    stack: error.stack,
    type: 'uncaughtException'
  });

  // Give logger time to write before exiting
  setTimeout(() => {
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  }, 100);
});

/**
 * Handle unhandled promise rejections
 * Log error and trigger graceful shutdown
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection - Async error not caught', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise,
    type: 'unhandledRejection'
  });

  // Give logger time to write before exiting
  setTimeout(() => {
    gracefulShutdown('UNHANDLED_REJECTION');
  }, 100);
});

/**
 * Handle SIGTERM signal (production deployments, Docker, Kubernetes)
 * Gracefully shutdown server
 */
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

/**
 * Handle SIGINT signal (Ctrl+C in development)
 * Gracefully shutdown server
 */
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

/**
 * Handle process warnings
 * Log warnings for debugging
 */
process.on('warning', (warning) => {
  logger.warn('Process warning', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  });
});

// Start server only if not in test environment
if (config.nodeEnv !== 'test') {
  startServer();
}

// Export for testing purposes
module.exports = {
  startServer,
  gracefulShutdown
};
