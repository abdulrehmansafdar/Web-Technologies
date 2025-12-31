/**
 * ===========================================
 * Project Routes
 * ===========================================
 * 
 * Routes for project management operations.
 * CRUD operations, member management.
 * 
 * @module routes/project
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Import controller
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember
} = require('../controllers/project.controller');

// Import middleware
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/projects
 * @desc    Get all projects for current user
 * @access  Private
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['planning', 'in-progress', 'on-hold', 'completed', 'cancelled']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], validate, getProjects);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private
 */
router.post('/', [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ max: 100 }).withMessage('Project name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('status')
    .optional()
    .isIn(['planning', 'in-progress', 'on-hold', 'completed', 'cancelled']),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color format')
], validate, createProject);

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project
 * @access  Private
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid project ID')
], validate, getProject);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private (Owner/Admin)
 */
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid project ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Project name must be 1-100 characters'),
  body('status')
    .optional()
    .isIn(['planning', 'in-progress', 'on-hold', 'completed', 'cancelled']),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
], validate, updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private (Owner/Admin)
 */
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid project ID')
], validate, deleteProject);

/**
 * @route   POST /api/projects/:id/members
 * @desc    Add member to project
 * @access  Private (Owner/Admin)
 */
router.post('/:id/members', [
  param('id').isMongoId().withMessage('Invalid project ID'),
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('role').optional().isIn(['viewer', 'member', 'admin'])
], validate, addMember);

/**
 * @route   DELETE /api/projects/:id/members/:userId
 * @desc    Remove member from project
 * @access  Private (Owner/Admin)
 */
router.delete('/:id/members/:userId', [
  param('id').isMongoId().withMessage('Invalid project ID'),
  param('userId').isMongoId().withMessage('Invalid user ID')
], validate, removeMember);

module.exports = router;
