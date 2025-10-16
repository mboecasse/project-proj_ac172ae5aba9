// File: src/models/Post.js
// Generated: 2025-10-16 09:21:04 UTC
// Project ID: proj_ac172ae5aba9
// Task ID: task_9ca9e8qrodaz


const mongoose = require('mongoose');

/**
 * Post Schema
 * Represents a blog post with title, content, author, and publication status
 */


const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [1, 'Title cannot be empty'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [1, 'Content cannot be empty']
  },
  author: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'published'],
      message: '{VALUE} is not a valid status. Status must be either draft or published'
    },
    default: 'draft'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Indexes for optimized queries
 */
// Single field indexes
postSchema.index({ status: 1 });
postSchema.index({ createdAt: -1 });

// Compound indexes for common query patterns
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });

// Text search index for title and content
postSchema.index({ title: 'text', content: 'text' });

/**
 * Virtual field: excerpt
 * Returns first 200 characters of content with ellipsis
 */
postSchema.virtual('excerpt').get(function() {
  if (!this.content) return '';
  return this.content.length > 200
    ? this.content.substring(0, 200) + '...'
    : this.content;
});

/**
 * Pre-save hook
 * Trims whitespace from title and author fields
 */
postSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.title = this.title.trim();
  }
  if (this.isModified('author') && this.author) {
    this.author = this.author.trim();
  }
  next();
});

/**
 * Instance method: isPublished
 * Checks if the post is published
 * @returns {Boolean} True if post status is published
 */
postSchema.methods.isPublished = function() {
  return this.status === 'published';
};

/**
 * Instance method: publish
 * Changes post status to published and saves
 * @returns {Promise<Post>} Updated post document
 */
postSchema.methods.publish = function() {
  this.status = 'published';
  return this.save();
};

/**
 * Instance method: unpublish
 * Changes post status to draft and saves
 * @returns {Promise<Post>} Updated post document
 */
postSchema.methods.unpublish = function() {
  this.status = 'draft';
  return this.save();
};

/**
 * Static method: findPublished
 * Retrieves published posts with pagination
 * @param {Object} options - Query options
 * @param {Number} options.limit - Maximum number of posts to return (default: 10)
 * @param {Number} options.skip - Number of posts to skip (default: 0)
 * @returns {Promise<Array>} Array of published posts
 */
postSchema.statics.findPublished = function(options = {}) {
  return this.find({ status: 'published' })
    .sort({ createdAt: -1 })
    .limit(options.limit || 10)
    .skip(options.skip || 0)
    .lean();
};

/**
 * Static method: findByAuthor
 * Retrieves posts by a specific author
 * @param {String} author - Author name
 * @param {Boolean} includeDrafts - Whether to include draft posts (default: false)
 * @returns {Promise<Array>} Array of posts by the author
 */
postSchema.statics.findByAuthor = function(author, includeDrafts = false) {
  const query = { author };
  if (!includeDrafts) {
    query.status = 'published';
  }
  return this.find(query).sort({ createdAt: -1 }).lean();
};

/**
 * Static method: searchPosts
 * Full-text search across title and content
 * @param {String} searchTerm - Search query
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of matching posts
 */
postSchema.statics.searchPosts = function(searchTerm, options = {}) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return Promise.resolve([]);
  }

  const sanitizedSearchTerm = searchTerm.trim();
  if (!sanitizedSearchTerm) {
    return Promise.resolve([]);
  }

  const query = {
    $text: { $search: sanitizedSearchTerm }
  };

  if (options.status) {
    if (options.status !== 'draft' && options.status !== 'published') {
      return Promise.resolve([]);
    }
    query.status = options.status;
  }

  const limit = parseInt(options.limit) || 10;
  const skip = parseInt(options.skip) || 0;

  if (limit < 0 || skip < 0 || !Number.isInteger(limit) || !Number.isInteger(skip)) {
    return Promise.resolve([]);
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .limit(Math.min(limit, 100))
    .skip(skip)
    .lean();
};

module.exports = mongoose.model('Post', postSchema);
