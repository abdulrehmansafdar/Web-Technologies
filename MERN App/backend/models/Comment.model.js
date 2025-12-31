/**
 * ===========================================
 * Comment Model - MongoDB Schema Definition
 * ===========================================
 * 
 * Defines the Comment schema for task discussions.
 * Enables team collaboration through comments on tasks.
 * 
 * @module models/Comment
 */

const mongoose = require('mongoose');

/**
 * Comment Schema Definition
 * 
 * Fields:
 * - content: Comment text content
 * - task: Reference to the task being commented on
 * - author: User who wrote the comment
 * - mentions: Array of mentioned users
 * - attachments: Files attached to the comment
 * - isEdited: Flag for edited comments
 * - parentComment: For nested replies
 */
const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  /**
   * Task Reference - Links comment to a task
   */
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Comment must be associated with a task']
  },
  /**
   * Author - User who created the comment
   */
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment must have an author']
  },
  /**
   * Mentioned Users - Users tagged in the comment with @
   */
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  /**
   * File Attachments
   */
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  }],
  /**
   * Edit tracking
   */
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  /**
   * Parent Comment - For nested replies (thread support)
   */
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  /**
   * Reactions/Likes
   */
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'heart', 'thumbsup', 'thumbsdown', 'celebrate'],
      default: 'like'
    }
  }],
  /**
   * Soft delete
   */
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual field to get reply count
 */
CommentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  justOne: false
});

/**
 * Virtual field to get reaction count
 */
CommentSchema.virtual('reactionCount').get(function() {
  return this.reactions ? this.reactions.length : 0;
});

/**
 * Pre-save middleware
 * Extracts @mentions from comment content
 */
CommentSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

/**
 * Static method to find comments by task
 * 
 * @param {ObjectId} taskId - Task's ID
 * @returns {Promise<Comment[]>} Array of comments
 */
CommentSchema.statics.findByTask = function(taskId) {
  return this.find({ task: taskId, isDeleted: false, parentComment: null })
    .populate('author', 'name email avatar')
    .populate({
      path: 'replies',
      match: { isDeleted: false },
      populate: { path: 'author', select: 'name email avatar' }
    })
    .sort({ createdAt: 1 });
};

/**
 * Instance method to add a reaction
 * 
 * @param {ObjectId} userId - User's ID
 * @param {string} type - Reaction type
 */
CommentSchema.methods.addReaction = function(userId, type = 'like') {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    r => r.user.toString() !== userId.toString()
  );
  // Add new reaction
  this.reactions.push({ user: userId, type });
};

/**
 * Instance method to remove a reaction
 * 
 * @param {ObjectId} userId - User's ID
 */
CommentSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(
    r => r.user.toString() !== userId.toString()
  );
};

// Create indexes for efficient queries
CommentSchema.index({ task: 1, createdAt: 1 });
CommentSchema.index({ author: 1 });
CommentSchema.index({ parentComment: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
