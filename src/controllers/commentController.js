// File: src/controllers/commentController.js
// Generated: 2025-10-16 09:23:24 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_xpxmczgdusqu


const ApiResponse = require('../utils/apiResponse');


const Comment = require('../models/Comment');


const Post = require('../models/Post');


const logger = require('../utils/logger');

/**
 * Get comments by post with pagination
 * @route GET /posts/:postId/comments
 */


const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate post exists
    const post = await Post.findById(postId);
    if (!post) {
      logger.warn(`Post not found: ${postId}`);
      return ApiResponse.notFound(res, 'Post not found');
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch comments and count in parallel to avoid race condition
    const [comments, total] = await Promise.all([
      Comment.find({ postId })
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 }),
      Comment.countDocuments({ postId })
    ]);

    logger.info(`Retrieved ${comments.length} comments for post ${postId}`, {
      postId,
      page: parseInt(page),
      limit: parseInt(limit),
      total
    });

    return ApiResponse.success(res, {
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn(`Invalid post ID format: ${req.params.postId}`);
      return ApiResponse.badRequest(res, 'Invalid post ID format');
    }
    logger.error(`Error fetching comments for post: ${error.message}`, {
      postId: req.params.postId,
      error: error.message,
      stack: error.stack
    });
    return ApiResponse.error(res, 'Failed to fetch comments');
  }
};

/**
 * Get comment by ID
 * @route GET /comments/:id
 */


const getCommentById = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      logger.warn(`Comment not found: ${id}`);
      return ApiResponse.notFound(res, 'Comment not found');
    }

    // Authorization check - verify user can view this comment
    if (req.user && req.user.id !== comment.author.toString() && req.user.role !== 'admin') {
      // If the post is private or restricted, check access
      const post = await Post.findById(comment.postId);
      if (post && post.isPrivate && post.author.toString() !== req.user.id) {
        logger.warn(`Unauthorized access attempt to comment: ${id}`, {
          userId: req.user.id,
          commentAuthor: comment.author
        });
        return ApiResponse.forbidden(res, 'Access denied');
      }
    }

    logger.info(`Retrieved comment: ${id}`);

    return ApiResponse.success(res, comment);
  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn(`Invalid comment ID format: ${req.params.id}`);
      return ApiResponse.badRequest(res, 'Invalid comment ID format');
    }
    logger.error(`Error fetching comment: ${error.message}`, {
      commentId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    return ApiResponse.error(res, 'Failed to fetch comment');
  }
};

/**
 * Create new comment
 * @route POST /comments
 */


const createComment = async (req, res) => {
  try {
    const { content, postId } = req.body;

    // Authorization check - user must be authenticated
    if (!req.user || !req.user.id) {
      logger.warn('Unauthenticated comment creation attempt');
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    // Validate required fields
    if (!content || !postId) {
      logger.warn('Missing required fields for comment creation', {
        hasContent: !!content,
        hasPostId: !!postId
      });
      return ApiResponse.badRequest(res, 'Content and postId are required');
    }

    // Validate post exists
    const post = await Post.findById(postId);
    if (!post) {
      logger.warn(`Cannot create comment - post not found: ${postId}`);
      return ApiResponse.notFound(res, 'Post not found');
    }

    // Check if user can comment on this post
    if (post.commentsDisabled) {
      logger.warn(`Cannot create comment - comments disabled for post: ${postId}`);
      return ApiResponse.forbidden(res, 'Comments are disabled for this post');
    }

    // Create comment with authenticated user as author
    const comment = await Comment.create({
      content,
      author: req.user.id,
      postId
    });

    logger.info(`Comment created: ${comment._id} for post ${postId}`, {
      commentId: comment._id,
      postId,
      author: req.user.id
    });

    return ApiResponse.created(res, comment, 'Comment created successfully');
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      logger.warn('Comment validation failed', { errors: messages });
      return ApiResponse.badRequest(res, messages.join(', '));
    }
    if (error.name === 'CastError') {
      logger.warn(`Invalid post ID format: ${req.body.postId}`);
      return ApiResponse.badRequest(res, 'Invalid post ID format');
    }
    logger.error(`Error creating comment: ${error.message}`, {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    return ApiResponse.error(res, 'Failed to create comment');
  }
};

/**
 * Update comment
 * @route PUT /comments/:id
 */


const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Authorization check - user must be authenticated
    if (!req.user || !req.user.id) {
      logger.warn('Unauthenticated comment update attempt');
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    // Find comment first to check ownership
    const comment = await Comment.findById(id);

    if (!comment) {
      logger.warn(`Comment not found for update: ${id}`);
      return ApiResponse.notFound(res, 'Comment not found');
    }

    // Authorization check - verify ownership or admin role
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`Unauthorized comment update attempt: ${id}`, {
        userId: req.user.id,
        commentAuthor: comment.author
      });
      return ApiResponse.forbidden(res, 'You can only update your own comments');
    }

    // Build update object with only allowed fields
    const updateData = {};
    if (content !== undefined) updateData.content = content;

    // Check if there are fields to update
    if (Object.keys(updateData).length === 0) {
      logger.warn('No valid fields to update', { commentId: id });
      return ApiResponse.badRequest(res, 'No valid fields to update');
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    logger.info(`Comment updated: ${id}`, {
      commentId: id,
      updatedFields: Object.keys(updateData),
      userId: req.user.id
    });

    return ApiResponse.success(res, updatedComment, 'Comment updated successfully');
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      logger.warn('Comment validation failed on update', { errors: messages });
      return ApiResponse.badRequest(res, messages.join(', '));
    }
    if (error.name === 'CastError') {
      logger.warn(`Invalid comment ID format: ${req.params.id}`);
      return ApiResponse.badRequest(res, 'Invalid comment ID format');
    }
    logger.error(`Error updating comment: ${error.message}`, {
      commentId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    return ApiResponse.error(res, 'Failed to update comment');
  }
};

/**
 * Delete comment
 * @route DELETE /comments/:id
 */


const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    // Authorization check - user must be authenticated
    if (!req.user || !req.user.id) {
      logger.warn('Unauthenticated comment deletion attempt');
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    // Find comment first to check ownership
    const comment = await Comment.findById(id);

    if (!comment) {
      logger.warn(`Comment not found for deletion: ${id}`);
      return ApiResponse.notFound(res, 'Comment not found');
    }

    // Authorization check - verify ownership or admin role
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`Unauthorized comment deletion attempt: ${id}`, {
        userId: req.user.id,
        commentAuthor: comment.author
      });
      return ApiResponse.forbidden(res, 'You can only delete your own comments');
    }

    await Comment.findByIdAndDelete(id);

    logger.info(`Comment deleted: ${id}`, {
      commentId: id,
      postId: comment.postId,
      userId: req.user.id
    });

    return ApiResponse.success(res, null, 'Comment deleted successfully');
  } catch (error) {
    if (error.name === 'CastError') {
      logger.warn(`Invalid comment ID format: ${req.params.id}`);
      return ApiResponse.badRequest(res, 'Invalid comment ID format');
    }
    logger.error(`Error deleting comment: ${error.message}`, {
      commentId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    return ApiResponse.error(res, 'Failed to delete comment');
  }
};

module.exports = {
  getCommentsByPost,
  getCommentById,
  createComment,
  updateComment,
  deleteComment
};
