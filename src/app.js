// File: src/app.js
// Generated: 2025-10-16 09:24:51 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_vnvei40c229f


const configureSecurityMiddleware = require('./middleware/security');


const express = require('express');


const logger = require('./utils/logger');


const morgan = require('morgan');


const routes = require('./routes');

const { RateLimiter } = require('./middleware/rateLimiter');

const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import custom middleware and utilities

// Initialize Express application


const app = express();

// Environment configuration


const isDevelopment = process.env.NODE_ENV === 'development';


const isProduction = process.env.NODE_ENV === 'production';

/**
 * Trust proxy configuration
 * Enable if running behind a reverse proxy (nginx, load balancer, etc.)
 */
if (isProduction) {
  app.set('trust proxy', 1);
  logger.info('Trust proxy enabled for production');
}

/**
 * JSON response formatting
 * Pretty print JSON responses in development for easier debugging
 */
if (isDevelopment) {
  app.set('json spaces', 2);
}

/**
 * 1. SECURITY MIDDLEWARE (FIRST)
 * Apply security headers, CORS, sanitization before any processing
 */
app.use(configureSecurityMiddleware());
logger.info('Security middleware configured');

/**
 * 2. RATE LIMITING (SECOND)
 * Prevent abuse and DoS attacks by limiting request rates
 */
app.use(RateLimiter());
logger.info('Rate limiting configured');

/**
 * 3. BODY PARSING (THIRD)
 * Parse incoming request bodies with size limits for security
 */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
logger.info('Body parsing middleware configured');

/**
 * 4. REQUEST LOGGING (FOURTH)
 * Log HTTP requests after parsing for complete information
 */
if (isDevelopment) {
  // Development: Detailed logging with colors
  app.use(morgan('dev', {
    stream: {
      write: (message) => logger.debug(message.trim())
    }
  }));
} else {
  // Production: Standard Apache combined log format
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    },
    skip: (req, res) => res.statusCode < 400 // Only log errors in production
  }));
}

/**
 * Health Check Endpoint
 * Used by load balancers and monitoring tools to verify service health
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * 5. API ROUTES (FIFTH)
 * Mount all application routes under /api/v1 prefix
 */
app.use('/api/v1', routes);
logger.info('API routes mounted at /api/v1');

/**
 * 6. 404 HANDLER (SIXTH)
 * Catch all unmatched routes and pass to error handler
 */
app.use(notFound);

/**
 * 7. ERROR HANDLER (LAST)
 * Global error handling middleware - must be last
 */
app.use(errorHandler);

/**
 * Export configured Express application
 * DO NOT call app.listen() here - server.js handles that
 * This allows for proper testing with supertest and separation of concerns
 */
module.exports = app;
