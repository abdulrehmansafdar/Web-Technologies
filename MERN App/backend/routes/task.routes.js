/**
 * ===========================================
 * Task Routes
 * ===========================================
 * 
 * Routes for task management operations.
 * CRUD, status updates, subtasks, attachments.
 * 
 * @module routes/task
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Import controller
const {
  getTasks,
  getTasksByProject,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  getMyTasks
} = require('../controllers/task.controller');

// Import middleware
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/tasks/my-tasks
 * @desc    Get current user's assigned tasks
 * @access  Private
 */
router.get('/my-tasks', getMyTasks);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks with filters
 * @access  Private
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional(),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('project').optional().isMongoId()
], validate, getTasks);

/**
 * @route   GET /api/tasks/project/:projectId
 * @desc    Get tasks by project (Kanban view)
 * @access  Private
 */
router.get('/project/:projectId', [
  param('projectId').isMongoId().withMessage('Invalid project ID')
], validate, getTasksByProject);

/**
 * @route   POST /api/tasks
 * @desc    Create new task
 * @access  Private
 */
router.post('/', [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('project')
    .notEmpty().withMessage('Project ID is required')
    .isMongoId().withMessage('Invalid project ID'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'in-review', 'completed']),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']),
  body('assignee')
    .optional()
    .isMongoId().withMessage('Invalid assignee ID'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 }),
  body('tags')
    .optional()
    .isArray()
], validate, createTask);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get single task
 * @access  Private
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid task ID')
], validate, getTask);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @access  Private
 */
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'in-review', 'completed']),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
], validate, updateTask);

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Update task status (for drag-drop)
 * @access  Private
 */
router.patch('/:id/status', [
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('status')
    .notEmpty()
    .isIn(['todo', 'in-progress', 'in-review', 'completed']),
  body('order').optional().isInt()
], validate, updateTaskStatus);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private
 */
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid task ID')
], validate, deleteTask);

/**
 * @route   POST /api/tasks/:id/subtasks
 * @desc    Add subtask
 * @access  Private
 */
router.post('/:id/subtasks', [
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('title')
    .trim()
    .notEmpty().withMessage('Subtask title is required')
    .isLength({ max: 200 })
], validate, addSubtask);

/**
 * @route   PATCH /api/tasks/:id/subtasks/:subtaskId
 * @desc    Toggle subtask completion
 * @access  Private
 */
router.patch('/:id/subtasks/:subtaskId', [
  param('id').isMongoId(),
  param('subtaskId').isMongoId()
], validate, toggleSubtask);

/**
 * @route   DELETE /api/tasks/:id/subtasks/:subtaskId
 * @desc    Delete subtask
 * @access  Private
 */
router.delete('/:id/subtasks/:subtaskId', [
  param('id').isMongoId(),
  param('subtaskId').isMongoId()
], validate, deleteSubtask);

module.exports = router;
