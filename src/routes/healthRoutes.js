// File: src/routes/healthRoutes.js
// Generated: 2025-10-16 09:20:41 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_oqjbsty4hemj


const ApiResponse = require('../utils/apiResponse');


const express = require('express');


const logger = require('../utils/logger');


const mongoose = require('../config/database');


const router = express.Router();

/**
 * Authentication middleware for health check endpoints
 * Validates API key or internal service token
 */


const authenticateHealthCheck = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  const validApiKey = process.env.HEALTH_CHECK_API_KEY;

  // Allow localhost access in development only for basic health check
  const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isBasicHealthCheck = req.path === '/' || req.path === '';

  if (isDevelopment && isLocalhost && isBasicHealthCheck) {
    return next();
  }

  if (!validApiKey) {
    logger.warn('Health check API key not configured');
    return res.status(503).json(ApiResponse.error('Service temporarily unavailable'));
  }

  if (!apiKey || apiKey !== validApiKey) {
    logger.warn('Unauthorized health check access attempt', {
      ip: req.ip,
      path: req.path
    });
    return res.status(404).json(ApiResponse.error('Not found'));
  }

  next();
};

/**
 * GET /health
 * Basic API health check
 * Returns API status, uptime, and timestamp
 */
router.get('/', authenticateHealthCheck, (req, res) => {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    logger.info('Health check performed', { status: 'ok' });

    return res.status(200).json(ApiResponse.success(healthData, 'API is healthy'));
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    return res.status(500).json(ApiResponse.error('Health check failed'));
  }
});

/**
 * GET /health/db
 * Database connection health check
 * Tests MongoDB connection and returns status
 */
router.get('/db', authenticateHealthCheck, async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;

    // readyState values: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const connectionStatus = stateMap[dbState] || 'unknown';
    const isHealthy = dbState === 1;

    if (isHealthy) {
      // Perform a lightweight database operation to verify connection
      await mongoose.connection.db.admin().ping();

      const healthData = {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
        connectionState: connectionStatus
      };

      logger.info('Database health check performed', { status: 'ok', database: 'connected' });

      return res.status(200).json(ApiResponse.success(healthData, 'Database is healthy'));
    } else {
      const healthData = {
        status: 'error',
        database: connectionStatus,
        timestamp: new Date().toISOString(),
        connectionState: connectionStatus
      };

      logger.warn('Database health check failed', { status: 'error', database: connectionStatus });

      return res.status(503).json(ApiResponse.error('Database connection unhealthy', healthData));
    }
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });

    const healthData = {
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      message: 'Database connection failed'
    };

    return res.status(503).json(ApiResponse.error('Database connection failed', healthData));
  }
});

module.exports = router;
