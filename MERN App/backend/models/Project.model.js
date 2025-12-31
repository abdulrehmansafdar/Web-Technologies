/**
 * ===========================================
 * Project Model - MongoDB Schema Definition
 * ===========================================
 * 
 * Defines the Project schema for project management.
 * Projects contain tasks and have team members assigned.
 * 
 * @module models/Project
 */

const mongoose = require('mongoose');

/**
 * Project Schema Definition
 * 
 * Fields:
 * - name: Project name
 * - description: Detailed project description
 * - status: Current project status
 * - priority: Project priority level
 * - owner: User who created the project
 * - members: Array of team members
 * - startDate: Project start date
 * - dueDate: Project deadline
 * - tags: Categories/labels for filtering
 * - color: UI color for project identification
 */
const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  /**
   * Project Owner - References User model
   * The user who created and owns the project
   */
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project must have an owner']
  },
  /**
   * Team Members - Array of User references
   * Users who are assigned to work on this project
   */
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'member', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  /**
   * Tags for categorization and filtering
   */
  tags: [{
    type: String,
    trim: true
  }],
  /**
   * Color for UI display
   */
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  /**
   * Project budget (optional)
   */
  budget: {
    estimated: {
      type: Number,
      default: 0
    },
    spent: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  /**
   * Project visibility
   */
  isPublic: {
    type: Boolean,
    default: false
  },
  /**
   * Archive status
   */
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual field to get project's tasks
 * Creates a relationship without storing task IDs in project document
 */
ProjectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  justOne: false
});

/**
 * Virtual field to calculate task statistics
 */
ProjectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true
});

/**
 * Pre-save middleware
 * Sets completedAt date when status changes to 'completed'
 */
ProjectSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

/**
 * Static method to find projects by owner
 * 
 * @param {ObjectId} ownerId - Owner's user ID
 * @returns {Promise<Project[]>} Array of projects
 */
ProjectSchema.statics.findByOwner = function(ownerId) {
  return this.find({ owner: ownerId }).populate('owner', 'name email avatar');
};

/**
 * Static method to find projects where user is a member
 * 
 * @param {ObjectId} userId - User's ID
 * @returns {Promise<Project[]>} Array of projects
 */
ProjectSchema.statics.findByMember = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'members.user': userId }
    ]
  }).populate('owner', 'name email avatar');
};

/**
 * Instance method to check if user is a project member
 * 
 * @param {ObjectId} userId - User's ID
 * @returns {boolean} True if user is member or owner
 */
ProjectSchema.methods.isMember = function(userId) {
  // Handle populated owner (object with _id) or unpopulated (ObjectId)
  const ownerId = this.owner._id ? this.owner._id : this.owner;
  return (
    ownerId.toString() === userId.toString() ||
    this.members.some(m => {
      const memberId = m.user._id ? m.user._id : m.user;
      return memberId.toString() === userId.toString();
    })
  );
};

/**
 * Instance method to add a member to the project
 * 
 * @param {ObjectId} userId - User's ID to add
 * @param {string} role - Member role
 */
ProjectSchema.methods.addMember = function(userId, role = 'member') {
  if (!this.isMember(userId)) {
    this.members.push({ user: userId, role });
  }
};

// Create indexes for efficient queries
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ 'members.user': 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ tags: 1 });
ProjectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', ProjectSchema);
