/**
 * ===========================================
 * User Routes
 * ===========================================
 * 
 * Routes for user management operations.
 * Admin routes for user CRUD, team member lookups.
 * 
 * @module routes/user
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');

// Import controller
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getTeamMembers
} = require('../controllers/user.controller');

// Import middleware
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/users/team/members
 * @desc    Get team members for dropdowns/autocomplete
 * @access  Private
 * 
 * This route must be defined BEFORE /:id route to avoid conflicts
 */
router.get('/team/members', getTeamMembers);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - search: Search by name or email
 * - role: Filter by role
 * - department: Filter by department
 * - sortBy: Field to sort by (default: createdAt)
 * - sortOrder: asc or desc (default: desc)
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Invalid page number'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  query('role').optional().isIn(['user', 'manager', 'admin']).withMessage('Invalid role'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], validate, getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID')
], validate, getUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (Admin only)
 * @access  Private/Admin
 */
router.put('/:id', [
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['user', 'manager', 'admin']),
  body('isActive').optional().isBoolean()
], validate, updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (Admin only - soft delete)
 * @access  Private/Admin
 */
router.delete('/:id', [
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid user ID')
], validate, deleteUser);

module.exports = router;
