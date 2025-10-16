// File: src/controllers/postController.js
// Generated: 2025-10-16 09:23:57 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_ro108pxsvooy


const ApiResponse = require('../utils/apiResponse');


const Comment = require('../models/Comment');


const Post = require('../models/Post');


const logger = require('../utils/logger');


const mongoose = require('mongoose');

/**
 * Get all posts with pagination
 * @route GET /api/posts
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 */


const getPosts = async (req, res, next) => {
  try {
    // Extract and validate pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    // Validate pagination values
    if (page < 1) {
      logger.warn('Invalid page number requested', { page });
      return res.status(400).json(ApiResponse.error('Page number must be greater than 0', 400));
    }

    if (limit < 1) {
      logger.warn('Invalid limit requested', { limit });
      return res.status(400).json(ApiResponse.error('Limit must be greater than 0', 400));
    }

    // Fetch posts with pagination
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination metadata
    const total = await Post.countDocuments();
    const totalPages = Math.ceil(total / limit);

    logger.info('Posts retrieved successfully', {
      page,
      limit,
      total,
      count: posts.length
    });

    return res.json(ApiResponse.success({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }));
  } catch (error) {
    logger.error('Error in getPosts', { error: error.message, stack: error.stack });
    return res.status(500).json(ApiResponse.error('Internal server error', 500));
  }
};

/**
 * Get post by ID
 * @route GET /api/posts/:id
 * @param {string} id - Post ID
 */


const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('Invalid post ID format', { id });
      return res.status(400).json(ApiResponse.error('Invalid post ID format', 400));
    }

    // Find post by ID
    const post = await Post.findById(id).lean();

    if (!post) {
      logger.warn('Post not found', { postId: id });
      return res.status(404).json(ApiResponse.error('Post not found', 404));
    }

    logger.info('Post retrieved successfully', { postId: id });

    return res.json(ApiResponse.success(post));
  } catch (error) {
    logger.error('Error in getPostById', {
      postId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json(ApiResponse.error('Internal server error', 500));
  }
};

/**
 * Create new post
 * @route POST /api/posts
 * @body {string} title - Post title (required)
 * @body {string} content - Post content (required)
 * @body {string} author - Post author (required)
 * @body {string} status - Post status (optional: draft/published)
 */


const createPost = async (req, res, next) => {
  try {
    const { title, content, author, status } = req.body;

    // Validate required fields
    if (!title || !content || !author) {
      logger.warn('Missing required fields for post creation', {
        hasTitle: !!title,
        hasContent: !!content,
        hasAuthor: !!author
      });
      return res.status(400).json(
        ApiResponse.error('Missing required fields: title, content, and author are required', 400)
      );
    }

    // Validate title and content are non-empty strings
    if (typeof title !== 'string' || title.trim().length === 0) {
      logger.warn('Invalid title provided', { title });
      return res.status(400).json(ApiResponse.error('Title must be a non-empty string', 400));
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      logger.warn('Invalid content provided');
      return res.status(400).json(ApiResponse.error('Content must be a non-empty string', 400));
    }

    if (typeof author !== 'string' || author.trim().length === 0) {
      logger.warn('Invalid author provided', { author });
      return res.status(400).json(ApiResponse.error('Author must be a non-empty string', 400));
    }

    // Validate status if provided
    if (status && !['draft', 'published'].includes(status)) {
      logger.warn('Invalid status provided', { status });
      return res.status(400).json(
        ApiResponse.error('Status must be either "draft" or "published"', 400)
      );
    }

    // Create post
    const postData = { title, content, author };
    if (status) {
      postData.status = status;
    }

    const post = new Post(postData);
    await post.save();

    logger.info('Post created successfully', {
      postId: post._id,
      title: post.title,
      author: post.author
    });

    return res.status(201).json(
      ApiResponse.success(post, 'Post created successfully')
    );
  } catch (error) {
    logger.error('Error in createPost', {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json(ApiResponse.error('Internal server error', 500));
  }
};

/**
 * Update post
 * @route PUT /api/posts/:id
 * @param {string} id - Post ID
 * @body {string} title - Post title (optional)
 * @body {string} content - Post content (optional)
 * @body {string} author - Post author (optional)
 * @body {string} status - Post status (optional: draft/published)
 */


const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, author, status } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('Invalid post ID format for update', { id });
      return res.status(400).json(ApiResponse.error('Invalid post ID format', 400));
    }

    // Find post
    const post = await Post.findById(id);

    if (!post) {
      logger.warn('Post not found for update', { postId: id });
      return res.status(404).json(ApiResponse.error('Post not found', 404));
    }

    // Validate and update fields
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        logger.warn('Invalid title provided for update', { title });
        return res.status(400).json(ApiResponse.error('Title must be a non-empty string', 400));
      }
      post.title = title;
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        logger.warn('Invalid content provided for update');
        return res.status(400).json(ApiResponse.error('Content must be a non-empty string', 400));
      }
      post.content = content;
    }

    if (author !== undefined) {
      if (typeof author !== 'string' || author.trim().length === 0) {
        logger.warn('Invalid author provided for update', { author });
        return res.status(400).json(ApiResponse.error('Author must be a non-empty string', 400));
      }
      post.author = author;
    }

    if (status !== undefined) {
      if (!['draft', 'published'].includes(status)) {
        logger.warn('Invalid status provided for update', { status });
        return res.status(400).json(
          ApiResponse.error('Status must be either "draft" or "published"', 400)
        );
      }
      post.status = status;
    }

    // Save updated post
    await post.save();

    logger.info('Post updated successfully', {
      postId: id,
      updatedFields: Object.keys(req.body)
    });

    return res.json(
      ApiResponse.success(post, 'Post updated successfully')
    );
  } catch (error) {
    logger.error('Error in updatePost', {
      postId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json(ApiResponse.error('Internal server error', 500));
  }
};

/**
 * Delete post and cascade delete associated comments
 * @route DELETE /api/posts/:id
 * @param {string} id - Post ID
 */


const deletePost = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('Invalid post ID format for deletion', { id });
      return res.status(400).json(ApiResponse.error('Invalid post ID format', 400));
    }

    await session.startTransaction();

    // Find and delete post in one atomic operation
    const post = await Post.findByIdAndDelete(id).session(session);

    if (!post) {
      await session.abortTransaction();
      logger.warn('Post not found for deletion', { postId: id });
      return res.status(404).json(ApiResponse.error('Post not found', 404));
    }

    // Cascade delete associated comments
    const deletedComments = await Comment.deleteMany({ postId: id }).session(session);
    logger.info('Deleted comments for post', {
      postId: id,
      commentCount: deletedComments.deletedCount
    });

    await session.commitTransaction();

    logger.info('Post deleted successfully', {
      postId: id,
      deletedComments: deletedComments.deletedCount
    });

    return res.json(
      ApiResponse.success(
        { deletedComments: deletedComments.deletedCount },
        'Post and associated comments deleted successfully'
      )
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error in deletePost', {
      postId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json(ApiResponse.error('Internal server error', 500));
  } finally {
    session.endSession();
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
};
