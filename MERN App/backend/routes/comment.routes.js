/**
 * ===========================================
 * Comment Routes
 * ===========================================
 * 
 * Routes for comment operations on tasks.
 * 
 * @module routes/comment
 */

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

// Import controller
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction
} = require('../controllers/comment.controller');

// Import middleware
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/comments/task/:taskId
 * @desc    Get comments for a task
 * @access  Private
 */
router.get('/task/:taskId', [
  param('taskId').isMongoId().withMessage('Invalid task ID')
], validate, getComments);

/**
 * @route   POST /api/comments
 * @desc    Create new comment
 * @access  Private
 */
router.post('/', [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 2000 }).withMessage('Comment cannot exceed 2000 characters'),
  body('taskId')
    .notEmpty().withMessage('Task ID is required')
    .isMongoId().withMessage('Invalid task ID'),
  body('parentCommentId')
    .optional()
    .isMongoId().withMessage('Invalid parent comment ID')
], validate, createComment);

/**
 * @route   PUT /api/comments/:id
 * @desc    Update comment
 * @access  Private (Author only)
 */
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid comment ID'),
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 2000 })
], validate, updateComment);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete comment (soft delete)
 * @access  Private (Author/Admin)
 */
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid comment ID')
], validate, deleteComment);

/**
 * @route   POST /api/comments/:id/reactions
 * @desc    Add reaction to comment
 * @access  Private
 */
router.post('/:id/reactions', [
  param('id').isMongoId().withMessage('Invalid comment ID'),
  body('type')
    .optional()
    .isIn(['like', 'heart', 'thumbsup', 'thumbsdown', 'celebrate'])
], validate, addReaction);

/**
 * @route   DELETE /api/comments/:id/reactions
 * @desc    Remove reaction from comment
 * @access  Private
 */
router.delete('/:id/reactions', [
  param('id').isMongoId().withMessage('Invalid comment ID')
], validate, removeReaction);

module.exports = router;
