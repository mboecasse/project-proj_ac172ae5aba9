// File: src/models/Comment.js
// Generated: 2025-10-16 09:21:00 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_jobssbdo0a3x


const createDOMPurify = require('isomorphic-dompurify');


const mongoose = require('mongoose');

async * Mongoose schema for blog comments with cascade delete support
 */


const MAX_PAGINATION_LIMIT = 100;

/**
 * Comment Schema Definition
 * Defines the structure for comment documents in MongoDB
 */


const commentSchema = new mongoose.Schema(
  {
    /**
     * Comment content/text
     * @type {String}
     * @required
     */
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters']
    },

    /**
     * Author name
     * @type {String}
     * @required
     */
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      minlength: [1, 'Author name cannot be empty'],
      maxlength: [100, 'Author name cannot exceed 100 characters']
    },

    /**
     * Reference to the parent post
     * @type {ObjectId}
     * @ref Post
     * @required
     */
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post reference is required'],
      index: true,
      validate: {
        validator: async function(value) {
          const Post = mongoose.model('Post');
          const post = await Post.findById(value);
          return post !== null;
        },
        message: 'Referenced post does not exist'
      }
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    versionKey: false
  }
);

/**
 * Indexes for query optimization
 * Compound index for efficient querying of comments by post with sorting
 */
commentSchema.index({ postId: 1, createdAt: -1 });

/**
 * Virtual for comment ID as string
 * Useful for consistent ID handling in API responses
 */
commentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

/**
 * Transform output for JSON serialization
 * Ensures consistent response format
 */
commentSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id.toHexString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

/**
 * Sanitize input to prevent XSS attacks
 * @param {String} input - Input string to sanitize
 * @returns {String} Sanitized string
 */


function sanitizeInput(input) {
  if (!input) return input;
  return createDOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}

/**
 * Pre-save hook for additional validation
 * Ensures data integrity before saving to database
 */
commentSchema.pre('save', function (next) {
  // Trim whitespace and sanitize content and author
  if (this.content) {
    this.content = sanitizeInput(this.content.trim());
  }
  if (this.author) {
    this.author = sanitizeInput(this.author.trim());
  }
  next();
});

/**
 * Static method to delete all comments for a post
 * Used for cascade delete operations when a post is deleted
 *
 * @param {ObjectId} postId - The ID of the post
 * @returns {Promise<Object>} Deletion result
 */
commentSchema.statics.deleteByPostId = async function (postId) {
  return await this.deleteMany({ postId });
};

/**
 * Static method to count comments for a post
 *
 * @param {ObjectId} postId - The ID of the post
 * @returns {Promise<Number>} Comment count
 */
commentSchema.statics.countByPostId = async function (postId) {
  return await this.countDocuments({ postId });
};

/**
 * Static method to find comments by post with pagination
 *
 * @param {ObjectId} postId - The ID of the post
 * @param {Object} options - Pagination options
 * @param {Number} options.page - Page number (default: 1)
 * @param {Number} options.limit - Items per page (default: 10)
 * @param {String} options.sort - Sort order (default: '-createdAt')
 * @returns {Promise<Array>} Array of comments
 */
commentSchema.statics.findByPostId = async function (postId, options = {}) {
  const page = Math.max(1, parseInt(options.page) || 1);
  let limit = parseInt(options.limit) || 10;

  // Cap the limit to prevent DoS attacks
  limit = Math.min(Math.max(1, limit), MAX_PAGINATION_LIMIT);

  const sort = options.sort || '-createdAt';
  const skip = (page - 1) * limit;

  return await this.find({ postId })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

/**
 * Instance method to check if comment belongs to a specific post
 *
 * @param {ObjectId} postId - The ID of the post to check
 * @returns {Boolean} True if comment belongs to post
 */
commentSchema.methods.belongsToPost = function (postId) {
  return this.postId.toString() === postId.toString();
};

/**
 * Create and export Comment model
 * This model is used throughout the application for comment operations
 */


const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
