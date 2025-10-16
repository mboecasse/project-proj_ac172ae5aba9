// File: tests/setup.js
// Generated: 2025-10-16 09:21:27 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_5toa5vfwgzbn


const mongoose = require('mongoose');

const { MongoMemoryServer } = require('mongodb-memory-server');


let mongoServer;

let setupCompleted = false;

/**
 * Setup MongoDB Memory Server before all tests
 * Creates an in-memory MongoDB instance for isolated testing
 */
beforeAll(async () => {
  try {
    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Create and start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    setupCompleted = true;
    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
}, 30000); // Increase timeout for server startup

/**
 * Clean up database collections after each test suite
 * Ensures test isolation by removing all data between tests
 */
afterEach(async () => {
  try {
    const collections = mongoose.connection.collections;

    // Delete all documents from all collections
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error('Database cleanup failed:', error);
    throw error;
  }
});

/**
 * Teardown after all tests complete
 * Closes database connection and stops MongoDB Memory Server
 */
afterAll(async () => {
  try {
    // Only proceed if setup completed successfully
    if (!setupCompleted) {
      return;
    }

    // Drop database
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }

    // Stop MongoDB Memory Server
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('Test database disconnected successfully');
  } catch (error) {
    console.error('Test teardown failed:', error);
    throw error;
  }
});

/**
 * Test Utility Functions
 * Provides helper functions for common test operations
 */


const testUtils = {
  /**
   * Create sample post data for testing
   * @param {Object} overrides - Optional fields to override defaults
   * @returns {Object} Post data object
   */
  createPostData: (overrides = {}) => ({
    title: 'Test Post Title',
    content: 'This is test post content for testing purposes.',
    author: 'Test Author',
    tags: ['test', 'sample'],
    published: true,
    ...overrides,
  }),

  /**
   * Create sample comment data for testing
   * @param {string} postId - ID of the post to comment on
   * @param {Object} overrides - Optional fields to override defaults
   * @returns {Object} Comment data object
   */
  createCommentData: (postId, overrides = {}) => ({
    postId,
    author: 'Test Commenter',
    content: 'This is a test comment.',
    ...overrides,
  }),

  /**
   * Create multiple sample posts
   * @param {number} count - Number of posts to create
   * @returns {Array} Array of post data objects
   */
  createMultiplePosts: (count = 3) => {
    const posts = [];
    for (let i = 1; i <= count; i++) {
      posts.push({
        title: `Test Post ${i}`,
        content: `Test content for post ${i}`,
        author: `Author ${i}`,
        tags: [`tag${i}`],
        published: true,
      });
    }
    return posts;
  },

  /**
   * Create multiple sample comments for a post
   * @param {string} postId - ID of the post
   * @param {number} count - Number of comments to create
   * @returns {Array} Array of comment data objects
   */
  createMultipleComments: (postId, count = 3) => {
    const comments = [];
    for (let i = 1; i <= count; i++) {
      comments.push({
        postId,
        author: `Commenter ${i}`,
        content: `Test comment ${i}`,
      });
    }
    return comments;
  },

  /**
   * Manually clear all database collections
   * Useful for cleanup in specific test scenarios
   */
  clearDatabase: async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  },

  /**
   * Get count of documents in a collection
   * @param {string} collectionName - Name of the collection
   * @returns {Promise<number>} Document count
   */
  getCollectionCount: async (collectionName) => {
    const collection = mongoose.connection.collections[collectionName];
    if (!collection) {
      return 0;
    }
    return await collection.countDocuments();
  },

  /**
   * Wait for a specific condition to be true
   * Useful for testing async operations
   * @param {Function} condition - Function that returns boolean
   * @param {number} timeout - Maximum wait time in ms
   * @param {number} interval - Check interval in ms
   * @returns {Promise<boolean>} True if condition met, false if timeout
   */
  waitFor: async (condition, timeout = 5000, interval = 100) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    return false;
  },
};

// Make test utilities available globally
global.testUtils = testUtils;

/**
 * Set Jest timeout for async operations
 * Allows sufficient time for database operations
 */
jest.setTimeout(10000);

/**
 * Suppress console warnings during tests (optional)
 * Uncomment if you want cleaner test output
 */
// global.console = {
//   ...console,
//   warn: jest.fn(),
//   error: jest.fn(),
// };

/**
 * Export utilities and server access functions
 * Allows tests to access MongoDB server instance if needed
 */
module.exports = {
  testUtils,
  getMongoServer: () => mongoServer,
  getConnection: () => mongoose.connection,
};
