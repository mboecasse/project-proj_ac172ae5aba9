// File: tests/comment.test.js
// Generated: 2025-10-16 09:31:36 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_h6eo2xra6nua


const Comment = require('../src/models/Comment');


const Post = require('../src/models/Post');


const app = require('../src/app');


const mongoose = require('mongoose');


const request = require('supertest');

* Tests CRUD operations, post relationship validation, and cascade delete functionality
 * Uses Jest and Supertest for HTTP testing
 */

// Test database connection string


const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/blog-api-test';

// Test data storage

let testPost;

let testComment;

/**
 * Setup: Connect to test database before all tests
 */
beforeAll(async () => {
  try {
    await mongoose.connect(MONGODB_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
});

/**
 * Setup: Clear database and create fresh test data before each test
 */
beforeEach(async () => {
  try {
    // Clear all collections
    await Comment.deleteMany({});
    await Post.deleteMany({});

    // Create test post for comment relationships
    testPost = await Post.create({
      title: 'Test Post for Comments',
      content: 'This is a test post to associate comments with',
      author: 'Test Author',
      status: 'published'
    });
  } catch (error) {
    console.error('Failed to setup test data:', error);
    throw error;
  }
});

/**
 * Teardown: Close database connection after all tests
 */
afterAll(async () => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error('Failed to close database connection:', error);
    throw error;
  }
});

describe('Comment API Integration Tests', () => {

  describe('POST /api/posts/:postId/comments', () => {

    test('should create a new comment with valid data', async () => {
      const commentData = {
        content: 'This is a test comment',
        author: 'Test Commenter'
      };

      const response = await request(app)
        .post(`/api/posts/${testPost._id}/comments`)
        .send(commentData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.content).toBe(commentData.content);
      expect(response.body.data.author).toBe(commentData.author);
      expect(response.body.data.postId.toString()).toBe(testPost._id.toString());
      expect(response.body.data).toHaveProperty('createdAt');

      // Verify comment exists in database
      const dbComment = await Comment.findById(response.body.data._id);
      expect(dbComment).toBeTruthy();
      expect(dbComment.content).toBe(commentData.content);
    });

    test('should fail to create comment with missing content', async () => {
      const commentData = {
        author: 'Test Commenter'
      };

      const response = await request(app)
        .post(`/api/posts/${testPost._id}/comments`)
        .send(commentData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    test('should fail to create comment with empty content', async () => {
      const commentData = {
        content: '',
        author: 'Test Commenter'
      };

      const response = await request(app)
        .post(`/api/posts/${testPost._id}/comments`)
        .send(commentData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    test('should fail to create comment with missing author', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      const response = await request(app)
        .post(`/api/posts/${testPost._id}/comments`)
        .send(commentData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    test('should fail to create comment with invalid post ID format', async () => {
      const commentData = {
        content: 'This is a test comment',
        author: 'Test Commenter'
      };

      const response = await request(app)
        .post('/api/posts/invalid-id/comments')
        .send(commentData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    test('should fail to create comment with non-existent post ID', async () => {
      const fakePostId = new mongoose.Types.ObjectId();
      const commentData = {
        content: 'This is a test comment',
        author: 'Test Commenter'
      };

      const response = await request(app)
        .post(`/api/posts/${fakePostId}/comments`)
        .send(commentData)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/post not found/i);
    });

  });

  describe('GET /api/posts/:postId/comments', () => {

    test('should retrieve all comments for a specific post', async () => {
      // Create multiple comments for the test post
      await Comment.create({
        content: 'First comment',
        author: 'Author 1',
        postId: testPost._id
      });
      await Comment.create({
        content: 'Second comment',
        author: 'Author 2',
        postId: testPost._id
      });

      const response = await request(app)
        .get(`/api/posts/${testPost._id}/comments`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].postId.toString()).toBe(testPost._id.toString());
      expect(response.body.data[1].postId.toString()).toBe(testPost._id.toString());
    });

    test('should return empty array for post with no comments', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost._id}/comments`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(0);
    });

    test('should fail to retrieve comments with invalid post ID', async () => {
      const response = await request(app)
        .get('/api/posts/invalid-id/comments')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    test('should return 404 for non-existent post', async () => {
      const fakePostId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/posts/${fakePostId}/comments`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/post not found/i);
    });

  });

  describe('GET /api/comments/:id', () => {

    beforeEach(async () => {
      testComment = await Comment.create({
        content: 'Test comment for retrieval',
        author: 'Test Author',
        postId: testPost._id
      });
    });

    test('should retrieve a single comment by ID', async () => {
      const response = await request(app)
        .get(`/api/comments/${testComment._id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testComment._id.toString());
      expect(response.body.data.content).toBe(testComment.content);
      expect(response.body.data.author).toBe(testComment.author);
      expect(response.body.data.postId.toString()).toBe(testPost._id.toString());
    });

    test('should return 404 for non-existent comment ID', async () => {
      const fakeCommentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/comments/${fakeCommentId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/comment not found/i);
    });

    test('should fail with invalid comment ID format', async () => {
      const response = await request(app)
        .get('/api/comments/invalid-id')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

  });

  describe('PUT /api/comments/:id', () => {

    beforeEach(async () => {
      testComment = await Comment.create({
        content: 'Original comment content',
        author: 'Original Author',
        postId: testPost._id
      });
    });

    test('should update comment content successfully', async () => {
      const updatedData = {
        content: 'Updated comment content',
        author: 'Updated Author'
      };

      const response = await request(app)
        .put(`/api/comments/${testComment._id}`)
        .send(updatedData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testComment._id.toString());
      expect(response.body.data.content).toBe(updatedData.content);
      expect(response.body.data.author).toBe(updatedData.author);

      // Verify update in database
      const dbComment = await Comment.findById(testComment._id);
      expect(dbComment.content).toBe(updatedData.content);
      expect(dbComment.author).toBe(updatedData.author);
    });

    test('should fail to update with empty content', async () => {
      const updatedData = {
        content: '',
        author: 'Updated Author'
      };

      const response = await request(app)
        .put(`/api/comments/${testComment._id}`)
        .send(updatedData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();

      // Verify comment was not updated
      const dbComment = await Comment.findById(testComment._id);
      expect(dbComment.content).toBe('Original comment content');
    });

    test('should fail to update with missing content', async () => {
      const updatedData = {
        author: 'Updated Author'
      };

      const response = await request(app)
        .put(`/api/comments/${testComment._id}`)
        .send(updatedData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    test('should return 404 for non-existent comment', async () => {
      const fakeCommentId = new mongoose.Types.ObjectId();
      const updatedData = {
        content: 'Updated content',
        author: 'Updated Author'
      };

      const response = await request(app)
        .put(`/api/comments/${fakeCommentId}`)
        .send(updatedData)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/comment not found/i);
    });

    test('should fail with invalid comment ID format', async () => {
      const updatedData = {
        content: 'Updated content',
        author: 'Updated Author'
      };

      const response = await request(app)
        .put('/api/comments/invalid-id')
        .send(updatedData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

  });

  describe('DELETE /api/comments/:id', () => {

    beforeEach(async () => {
      testComment = await Comment.create({
        content: 'Comment to be deleted',
        author: 'Test Author',
        postId: testPost._id
      });
    });

    test('should delete comment successfully', async () => {
      const response = await request(app)
        .delete(`/api/comments/${testComment._id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/deleted successfully/i);

      // Verify comment is deleted from database
      const dbComment = await Comment.findById(testComment._id);
      expect(dbComment).toBeNull();
    });

    test('should return 404 for non-existent comment', async () => {
      const fakeCommentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/comments/${fakeCommentId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/comment not found/i);
    });

    test('should return 404 when deleting already deleted comment', async () => {
      // Delete comment first time
      await request(app)
        .delete(`/api/comments/${testComment._id}`)
        .expect(200);

      // Try to delete again
      const response = await request(app)
        .delete(`/api/comments/${testComment._id}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/comment not found/i);
    });

    test('should fail with invalid comment ID format', async () => {
      const response = await request(app)
        .delete('/api/comments/invalid-id')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

  });

  describe('Cascade Delete - Post Deletion', () => {

    test('should delete all comments when post is deleted', async () => {
      // Create multiple comments for the test post
      const comment1 = await Comment.create({
        content: 'First comment',
        author: 'Author 1',
        postId: testPost._id
      });
      const comment2 = await Comment.create({
        content: 'Second comment',
        author:
