// File: src/middleware/rateLimiter.js
// Generated: 2025-10-16 09:23:47 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_38vbxxrq8vgy


const config = require('../config/env');


const rateLimit = require('express-rate-limit');

* from abuse and ensure fair usage across all clients.
 *
 * Features:
 * - Multiple rate limiter configurations for different endpoint types
 * - IP-based request tracking with proxy support
 * - Configurable time windows and request limits
 * - Standard RateLimit headers for client information
 * - Consistent error response format
 * - Production-ready with Redis support comments
 */

/**
 * Key Generator with Proxy Support
 *
 * Generates rate limit keys based on IP address, with support for
 * trusted proxy headers to prevent bypassing via X-Forwarded-For spoofing.
 *
 * @param {Object} req - Express request object
 * @returns {string} Rate limit key (IP address or user identifier)
 */


const keyGenerator = (req) => {
  // If user is authenticated, use user ID for more accurate tracking
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }

  // Use IP address from request (express-rate-limit handles proxy trust)
  return req.ip;
};

/**
 * General API Rate Limiter
 *
 * Applied to most API endpoints for general protection.
 * Default: 100 requests per 15 minutes per IP
 */


const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false, // Count failed requests
  keyGenerator: keyGenerator,
  handler: (req, res) => {
    const resetTime = new Date(req.rateLimit.resetTime);
    const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);

    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: retryAfterSeconds
    });
  }
});

/**
 * Authentication Rate Limiter
 *
 * Stricter limiter for authentication endpoints (login, register, password reset).
 * Prevents brute force attacks while allowing legitimate users to retry.
 * Default: 5 requests per 15 minutes per IP
 *
 * Note: skipSuccessfulRequests is enabled to prevent lockout of legitimate users
 * after successful authentication.
 */


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 failed attempts per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful authentication attempts
  skipFailedRequests: false,
  keyGenerator: keyGenerator,
  handler: (req, res) => {
    const resetTime = new Date(req.rateLimit.resetTime);
    const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);

    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: retryAfterSeconds
    });
  }
});

/**
 * Write Operations Rate Limiter
 *
 * Applied to POST, PUT, PATCH, DELETE operations to prevent abuse.
 * More restrictive than read operations but allows reasonable usage.
 * Default: 50 requests per hour per IP
 */


const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 write operations per hour
  message: {
    success: false,
    error: 'Too many write operations from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: keyGenerator,
  handler: (req, res) => {
    const resetTime = new Date(req.rateLimit.resetTime);
    const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);

    res.status(429).json({
      success: false,
      error: 'Too many write operations from this IP, please try again later.',
      retryAfter: retryAfterSeconds
    });
  }
});

/**
 * Read Operations Rate Limiter
 *
 * Lenient limiter for GET requests to allow reasonable browsing and data access.
 * Default: 200 requests per 15 minutes per IP
 */


const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 read operations per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: keyGenerator,
  handler: (req, res) => {
    const resetTime = new Date(req.rateLimit.resetTime);
    const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);

    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: retryAfterSeconds
    });
  }
});

/**
 * Strict Rate Limiter
 *
 * Very restrictive limiter for sensitive operations (e.g., password reset, email verification).
 * Default: 3 requests per hour per IP
 */


const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    error: 'Too many requests for this sensitive operation, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: keyGenerator,
  handler: (req, res) => {
    const resetTime = new Date(req.rateLimit.resetTime);
    const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);

    res.status(429).json({
      success: false,
      error: 'Too many requests for this sensitive operation, please try again later.',
      retryAfter: retryAfterSeconds
    });
  }
});

/**
 * Create Custom Rate Limiter
 *
 * Factory function to create custom rate limiters with specific configurations.
 * Useful for endpoints with unique rate limiting requirements.
 *
 * @param {Object} options - Rate limiter configuration options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests per window
 * @param {string} options.message - Custom error message
 * @param {boolean} options.skipSuccessfulRequests - Whether to skip successful requests
 * @param {boolean} options.skipFailedRequests - Whether to skip failed requests
 * @returns {Function} Express rate limiter middleware
 *
 * @example
 * const customLimiter = createapiLimiter({
 *   windowMs: 60 * 1000, // 1 minute
 *   max: 10,
 *   message: 'Custom rate limit exceeded'
 * });
 */


const createapiLimiter = (options = {}) => {
  const defaults = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  };

  const settings = { ...defaults, ...options };

  return rateLimit({
    windowMs: settings.windowMs,
    max: settings.max,
    message: {
      success: false,
      error: settings.message,
      retryAfter: Math.ceil(settings.windowMs / 1000) + ' seconds'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: settings.skipSuccessfulRequests,
    skipFailedRequests: settings.skipFailedRequests,
    keyGenerator: keyGenerator,
    handler: (req, res) => {
      const resetTime = new Date(req.rateLimit.resetTime);
      const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);

      res.status(429).json({
        success: false,
        error: settings.message,
        retryAfter: retryAfterSeconds
      });
    }
  });
};

/**
 * PRODUCTION NOTE: Redis Store for Distributed Systems
 *
 * For production environments with multiple server instances (load balanced),
 * use Redis as the rate limit store to share rate limit data across instances.
 *
 * Installation:
 * npm install redis rate-limit-redis
 *
 * Usage:
 * const redis = require('redis');
 * const RedisStore = require('rate-limit-redis');
 *
 * const redisClient = redis.createClient({
 *   host: process.env.REDIS_HOST || 'localhost',
 *   port: process.env.REDIS_PORT || 6379,
 *   password: process.env.REDIS_PASSWORD
 * });
 *
 * Then add to rate limiter config:
 * store: new RedisStore({
 *   client: redisClient,
 *   prefix: 'rl:' // Rate limit key prefix
 * })
 *
 * This ensures rate limits are enforced consistently across all server instances.
 *
 * SECURITY NOTE: Proxy Configuration
 *
 * To properly handle X-Forwarded-For headers and prevent IP spoofing,
 * configure Express trust proxy setting in your main app file:
 *
 * app.set('trust proxy', 1); // Trust first proxy
 * // OR for specific proxies:
 * app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
 * // OR for cloud environments (AWS, Azure, etc.):
 * app.set('trust proxy', true);
 *
 * Without proper trust proxy configuration, rate limiting can be bypassed
 * by manipulating X-Forwarded-For headers.
 */

module.exports = {
  apiLimiter,
  authLimiter,
  writeLimiter,
  readLimiter,
  strictLimiter,
  createapiLimiter
};
