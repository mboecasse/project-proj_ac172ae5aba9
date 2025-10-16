// File: tests/post.test.js
// Generated: 2025-10-16 09:28:09 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_wu10ozglbp4p


const Post = require('../src/models/Post');


const app = require('../src/app');


const mongoose = require('mongoose');


const request = require('supertest');

/**
 * Post API Integration Tests
 * Tests all CRUD operations, validation, error cases, and pagination
 */
describe('Post API Integration Tests', () => {
  // Setup: Connect to test database before all tests
  beforeAll(async () => {
    const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/blog-test';
    await mongoose.connect(testDbUri);
  });

  // Cleanup: Clear posts collection before each test for isolation
  beforeEach(async () => {
    await Post.deleteMany({});
  });

  // Teardown: Close database connection after all tests
  afterAll(async () => {
    await Post.deleteMany({});
    await mongoose.connection.close();
  });

  /**
   * POST /api/posts - Create new post
   */
  describe('POST /api/posts', () => {
    it('should create a new post with valid data', async () => {
      const newPost = {
        title: 'Test Post Title',
        content: 'This is test content for the post.',
        author: 'John Doe'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(newPost)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(newPost.title);
      expect(response.body.content).toBe(newPost.content);
      expect(response.body.author).toBe(newPost.author);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      // Verify database persistence
      const dbPost = await Post.findById(response.body._id);
      expect(dbPost).toBeTruthy();
      expect(dbPost.title).toBe(newPost.title);
    });

    it('should return 400 when title is missing', async () => {
      const invalidPost = {
        content: 'Content without title',
        author: 'John Doe'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/title|required/i);
    });

    it('should return 400 when content is missing', async () => {
      const invalidPost = {
        title: 'Title without content',
        author: 'John Doe'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/content|required/i);
    });

    it('should return 400 when author is missing', async () => {
      const invalidPost = {
        title: 'Test Title',
        content: 'Test content'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/author|required/i);
    });

    it('should return 400 when title is empty string', async () => {
      const invalidPost = {
        title: '',
        content: 'Test content',
        author: 'John Doe'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when data types are invalid', async () => {
      const invalidPost = {
        title: 123,
        content: true,
        author: ['invalid']
      };

      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should create post with default status if not provided', async () => {
      const newPost = {
        title: 'Test Post',
        content: 'Test content',
        author: 'John Doe'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(newPost)
        .expect(201);

      expect(response.body.status).toBeDefined();
    });
  });

  /**
   * GET /api/posts - Retrieve all posts
   */
  describe('GET /api/posts', () => {
    it('should retrieve all posts with default pagination', async () => {
      // Seed test data
      await Post.create([
        { title: 'Post 1', content: 'Content 1', author: 'Author 1' },
        { title: 'Post 2', content: 'Content 2', author: 'Author 2' },
        { title: 'Post 3', content: 'Content 3', author: 'Author 3' }
      ]);

      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.posts).toHaveLength(3);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toMatchObject({
        total: 3,
        page: 1
      });
      expect(response.body.pagination.limit).toBeGreaterThan(0);
    });

    it('should handle pagination parameters correctly', async () => {
      // Create 15 posts
      const posts = Array.from({ length: 15 }, (_, i) => ({
        title: `Post ${i + 1}`,
        content: `Content ${i + 1}`,
        author: 'Test Author'
      }));
      await Post.create(posts);

      const response = await request(app)
        .get('/api/posts?page=2&limit=5')
        .expect(200);

      expect(response.body.posts).toHaveLength(5);
      expect(response.body.pagination).toMatchObject({
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3
      });
    });

    it('should return empty array when no posts exist', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.posts).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should handle page parameter correctly', async () => {
      // Create 10 posts
      const posts = Array.from({ length: 10 }, (_, i) => ({
        title: `Post ${i + 1}`,
        content: `Content ${i + 1}`,
        author: 'Test Author'
      }));
      await Post.create(posts);

      const response = await request(app)
        .get('/api/posts?page=1&limit=5')
        .expect(200);

      expect(response.body.posts).toHaveLength(5);
      expect(response.body.pagination.page).toBe(1);
    });

    it('should handle limit parameter correctly', async () => {
      // Create 10 posts
      const posts = Array.from({ length: 10 }, (_, i) => ({
        title: `Post ${i + 1}`,
        content: `Content ${i + 1}`,
        author: 'Test Author'
      }));
      await Post.create(posts);

      const response = await request(app)
        .get('/api/posts?limit=3')
        .expect(200);

      expect(response.body.posts).toHaveLength(3);
      expect(response.body.pagination.limit).toBe(3);
    });

    it('should return correct totalPages in pagination', async () => {
      // Create 12 posts
      const posts = Array.from({ length: 12 }, (_, i) => ({
        title: `Post ${i + 1}`,
        content: `Content ${i + 1}`,
        author: 'Test Author'
      }));
      await Post.create(posts);

      const response = await request(app)
        .get('/api/posts?limit=5')
        .expect(200);

      expect(response.body.pagination.totalPages).toBe(3);
    });

    it('should handle invalid page parameter gracefully', async () => {
      await Post.create([
        { title: 'Post 1', content: 'Content 1', author: 'Author 1' }
      ]);

      const response = await request(app)
        .get('/api/posts?page=invalid')
        .expect(200);

      expect(response.body.posts).toBeDefined();
    });

    it('should handle invalid limit parameter gracefully', async () => {
      await Post.create([
        { title: 'Post 1', content: 'Content 1', author: 'Author 1' }
      ]);

      const response = await request(app)
        .get('/api/posts?limit=invalid')
        .expect(200);

      expect(response.body.posts).toBeDefined();
    });
  });

  /**
   * GET /api/posts/:id - Retrieve single post
   */
  describe('GET /api/posts/:id', () => {
    it('should retrieve a single post by valid ID', async () => {
      const post = await Post.create({
        title: 'Single Post',
        content: 'Single post content',
        author: 'Test Author'
      });

      const response = await request(app)
        .get(`/api/posts/${post._id}`)
        .expect(200);

      expect(response.body._id).toBe(post._id.toString());
      expect(response.body.title).toBe(post.title);
      expect(response.body.content).toBe(post.content);
      expect(response.body.author).toBe(post.author);
    });

    it('should return 404 for non-existent post ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/posts/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/not found/i);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/posts/invalid-id-format')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid|id/i);
    });

    it('should return post with all required fields', async () => {
      const post = await Post.create({
        title: 'Complete Post',
        content: 'Complete content',
        author: 'Complete Author'
      });

      const response = await request(app)
        .get(`/api/posts/${post._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('author');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });
  });

  /**
   * PUT /api/posts/:id - Update post
   */
  describe('PUT /api/posts/:id', () => {
    it('should update post with valid data', async () => {
      const post = await Post.create({
        title: 'Original Title',
        content: 'Original content',
        author: 'Original Author'
      });

      const updates = {
        title: 'Updated Title',
        content: 'Updated content',
        author: 'Updated Author'
      };

      const response = await request(app)
        .put(`/api/posts/${post._id}`)
        .send(updates)
        .expect(200);

      expect(response.body.title).toBe(updates.title);
      expect(response.body.content).toBe(updates.content);
      expect(response.body.author).toBe(updates.author);

      // Verify database update
      const dbPost = await Post.findById(post._id);
      expect(dbPost.title).toBe(updates.title);
      expect(dbPost.content).toBe(updates.content);
    });

    it('should handle partial update (only some fields)', async () => {
      const post = await Post.create({
        title: 'Original Title',
        content: 'Original content',
        author: 'Original Author'
      });

      const updates = {
        title: 'Updated Title Only'
      };

      const response = await request(app)
        .put(`/api/posts/${post._id}`)
        .send(updates)
        .expect(200);

      expect(response.body.title).toBe(updates.title);
      expect(response.body.content).toBe(post.content);
      expect(response.body.author).toBe(post.author);
    });

    it('should return 400 when updating with invalid data', async () => {
      const post = await Post.create({
        title: 'Original Title',
        content: 'Original content',
        author: 'Original Author'
      });

      const invalidUpdates = {
        title: '',
        content: 'Valid content'
      };

      const response = await request(app)
        .put(`/api/posts/${post._id}`)
        .send(invalidUpdates)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 when updating non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updates = {
        title: 'Updated Title',
        content: 'Updated content'
      };

      const response = await request(app)
        .put(`/api/posts/${fakeId}`)
        .send(updates)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/not found/i);
    });

    it('should return 400 for invalid ID format', async () => {
      const updates = {
        title: 'Updated Title',
        content: 'Updated content'
      };

      const response = await request(app)
        .put('/api/posts/invalid-id')
        .send(updates)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should update updatedAt timestamp', async () => {
      const post = await Post.create({
        title: 'Original Title',
        content: 'Original content',
        author: 'Original Author'
      });

      const originalUpdatedAt = post.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const updates = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put(`/api/posts/${post._id}`)
        .send(updates)
        .expect(200);

      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });

    it('should reject update with invalid data types', async () => {
      const post = await Post.create({
        title: 'Original Title',
        content: 'Original content',
        author: 'Original Author'
      });

      const invalidUpdates = {
        title: 123,
        content: true
      };

      const response = await request(app)
        .put(`/api/posts/${post._id}`)
