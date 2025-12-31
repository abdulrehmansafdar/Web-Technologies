/**
 * ===========================================
 * Dashboard Routes
 * ===========================================
 * 
 * Routes for dashboard analytics and statistics.
 * 
 * @module routes/dashboard
 */

const express = require('express');
const router = express.Router();

// Import controller
const {
  getStats,
  getActivity,
  getDeadlines,
  getTeamPerformance
} = require('../controllers/dashboard.controller');

// Import middleware
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get recent activity feed
 * @access  Private
 */
router.get('/activity', getActivity);

/**
 * @route   GET /api/dashboard/deadlines
 * @desc    Get upcoming deadlines
 * @access  Private
 */
router.get('/deadlines', getDeadlines);

/**
 * @route   GET /api/dashboard/team-performance
 * @desc    Get team performance metrics
 * @access  Private (Manager/Admin)
 */
router.get('/team-performance', authorize('manager', 'admin'), getTeamPerformance);

module.exports = router;
