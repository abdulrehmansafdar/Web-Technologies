/**
 * ===========================================
 * Task Model - MongoDB Schema Definition
 * ===========================================
 * 
 * Defines the Task schema for task management within projects.
 * Tasks are the core unit of work in the project management system.
 * 
 * @module models/Task
 */

const mongoose = require('mongoose');

/**
 * Subtask Schema (Embedded Document)
 * Represents smaller units of work within a task
 */
const SubtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Subtask title is required'],
    trim: true,
    maxlength: [200, 'Subtask title cannot exceed 200 characters']
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date
}, { _id: true, timestamps: true });

/**
 * Attachment Schema (Embedded Document)
 * Represents files attached to a task
 */
const AttachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: String,
  size: Number,
  path: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true, timestamps: true });

/**
 * Task Schema Definition
 * 
 * Fields:
 * - title: Task title/name
 * - description: Detailed task description
 * - status: Current task status (kanban-style)
 * - priority: Task priority level
 * - project: Reference to parent project
 * - creator: User who created the task
 * - assignee: User assigned to complete the task
 * - subtasks: Array of smaller tasks
 * - attachments: Array of file attachments
 * - dueDate: Task deadline
 * - estimatedHours: Estimated time to complete
 * - actualHours: Actual time spent
 * - tags: Labels for filtering
 */
const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  /**
   * Task Status - Kanban board columns
   * - todo: Not started yet
   * - in-progress: Currently being worked on
   * - in-review: Awaiting review/approval
   * - completed: Done
   */
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'in-review', 'completed'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  /**
   * Project Reference - Links task to a project
   */
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Task must belong to a project']
  },
  /**
   * Creator - User who created the task
   */
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must have a creator']
  },
  /**
   * Assignee - User responsible for completing the task
   */
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  /**
   * Subtasks - Smaller units of work within this task
   */
  subtasks: [SubtaskSchema],
  /**
   * File Attachments
   */
  attachments: [AttachmentSchema],
  /**
   * Timeline Fields
   */
  startDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  /**
   * Time Tracking
   */
  estimatedHours: {
    type: Number,
    default: 0,
    min: [0, 'Estimated hours cannot be negative']
  },
  actualHours: {
    type: Number,
    default: 0,
    min: [0, 'Actual hours cannot be negative']
  },
  /**
   * Tags for categorization
   */
  tags: [{
    type: String,
    trim: true
  }],
  /**
   * Task order for drag-and-drop sorting
   */
  order: {
    type: Number,
    default: 0
  },
  /**
   * Watch list - Users who receive notifications about this task
   */
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  /**
   * Task dependencies - Tasks that must be completed before this one
   */
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
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
 * Virtual field to get comment count
 */
TaskSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'task',
  justOne: false
});

/**
 * Virtual field to calculate subtask progress
 */
TaskSchema.virtual('subtaskProgress').get(function() {
  if (this.subtasks.length === 0) return 100;
  const completed = this.subtasks.filter(st => st.isCompleted).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

/**
 * Virtual field to check if task is overdue
 */
TaskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

/**
 * Pre-save middleware
 * Sets completedAt date when status changes to 'completed'
 */
TaskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed') {
      this.completedAt = undefined;
    }
  }
  next();
});

/**
 * Static method to find tasks by project
 * 
 * @param {ObjectId} projectId - Project's ID
 * @returns {Promise<Task[]>} Array of tasks
 */
TaskSchema.statics.findByProject = function(projectId) {
  return this.find({ project: projectId, isArchived: false })
    .populate('assignee', 'name email avatar')
    .populate('creator', 'name email avatar')
    .sort({ order: 1, createdAt: -1 });
};

/**
 * Static method to find tasks assigned to a user
 * 
 * @param {ObjectId} userId - User's ID
 * @returns {Promise<Task[]>} Array of tasks
 */
TaskSchema.statics.findByAssignee = function(userId) {
  return this.find({ assignee: userId, isArchived: false })
    .populate('project', 'name color')
    .sort({ dueDate: 1, priority: -1 });
};

/**
 * Instance method to toggle subtask completion
 * 
 * @param {ObjectId} subtaskId - Subtask's ID
 */
TaskSchema.methods.toggleSubtask = function(subtaskId) {
  const subtask = this.subtasks.id(subtaskId);
  if (subtask) {
    subtask.isCompleted = !subtask.isCompleted;
    subtask.completedAt = subtask.isCompleted ? new Date() : undefined;
  }
};

// Create indexes for efficient queries
TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ assignee: 1 });
TaskSchema.index({ creator: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ status: 1, priority: 1 });
TaskSchema.index({ tags: 1 });

module.exports = mongoose.model('Task', TaskSchema);
