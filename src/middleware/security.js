// File: src/middleware/security.js
// Generated: 2025-10-16 09:21:08 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_cxdw52v54mnx


const cors = require('cors');


const helmet = require('helmet');


const hpp = require('hpp');


const logger = require('../utils/logger');


const mongoSanitize = require('express-mongo-sanitize');


const rateLimit = require('express-rate-limit');

/**
 * Configure security middleware for Express application
 * Sets up helmet, CORS, rate limiting, NoSQL injection prevention, and HPP
 *
 * @param {Express.Application} app - Express application instance
 */


const configureSecurityMiddleware = (app) => {
  try {
    // 1. Helmet - Security headers configuration
    const helmetConfig = {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    };

    app.use(helmet(helmetConfig));
    logger.info('Helmet security headers configured');

    // 2. CORS - Cross-Origin Resource Sharing configuration
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? (process.env.CORS_ORIGIN || '').split(',').filter(Boolean)
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'];

    const corsOptions = {
      origin: function (origin, callback) {
        // Reject requests with no origin in production
        if (!origin) {
          if (process.env.NODE_ENV === 'production') {
            logger.warn('CORS blocked request with no origin');
            return callback(new Error('Not allowed by CORS'));
          }
          return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          logger.warn('CORS blocked request', { origin });
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 86400, // 24 hours
    };

    app.use(cors(corsOptions));
    logger.info('CORS configured', { allowedOrigins });

    // 3. Rate Limiting - Prevent brute force and abuse
    const apiLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
        });
        res.status(429).json({
          success: false,
          error: 'Too many requests from this IP, please try again later.',
        });
      },
      skip: (req) => {
        // Skip rate limiting for health check endpoints
        return req.path === '/health' || req.path === '/api/health';
      },
    });

    // Apply rate limiting to API routes
    app.use('/api/', apiLimiter);
    logger.info('Rate limiting configured', {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    });

    // Stricter rate limit for authentication routes
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per window
      message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.warn('Auth rate limit exceeded', {
          ip: req.ip,
          path: req.path,
        });
        res.status(429).json({
          success: false,
          error: 'Too many authentication attempts, please try again later.',
        });
      },
    });

    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
    logger.info('Authentication rate limiting configured');

    // 4. MongoDB Sanitization - Prevent NoSQL injection
    app.use(mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        logger.warn('NoSQL injection attempt detected', {
          ip: req.ip,
          path: req.path,
          key,
        });
      },
    }));
    logger.info('MongoDB sanitization configured');

    // 5. HPP - HTTP Parameter Pollution prevention
    const hppConfig = {
      whitelist: [
        'tags',
        'categories',
        'sort',
        'fields',
        'page',
        'limit',
      ],
    };

    app.use(hpp(hppConfig));
    logger.info('HPP protection configured', { whitelist: hppConfig.whitelist });

    // 6. Additional security headers
    app.disable('x-powered-by');

    app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      next();
    });

    logger.info('Additional security headers configured');

    // 7. CORS error handler
    app.use((err, req, res, next) => {
      if (err.message === 'Not allowed by CORS') {
        logger.error('CORS policy violation', {
          origin: req.get('origin'),
          ip: req.ip,
          path: req.path,
        });
        return res.status(403).json({
          success: false,
          error: 'CORS policy violation - origin not allowed',
        });
      }
      next(err);
    });

    logger.info('Security middleware configuration completed successfully');

  } catch (error) {
    logger.error('Failed to configure security middleware', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = configureSecurityMiddleware;
