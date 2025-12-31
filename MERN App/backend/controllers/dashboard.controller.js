/**
 * ===========================================
 * Dashboard Controller
 * ===========================================
 * 
 * Provides analytics and summary data for the dashboard:
 * - Project statistics
 * - Task statistics
 * - Recent activity
 * - Performance metrics
 * 
 * @module controllers/dashboard
 */

const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const User = require('../models/User.model');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 * 
 * Returns comprehensive statistics for the user's dashboard
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get projects where user is owner or member
    const userProjects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ],
      isArchived: false
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);

    // Project statistics
    const projectStats = await Project.aggregate([
      {
        $match: {
          _id: { $in: projectIds },
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Task statistics
    const taskStats = await Task.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // My tasks statistics
    const myTaskStats = await Task.aggregate([
      {
        $match: {
          assignee: req.user._id,
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Priority breakdown
    const priorityStats = await Task.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          isArchived: false,
          status: { $ne: 'completed' }
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Overdue tasks count
    const overdueCount = await Task.countDocuments({
      project: { $in: projectIds },
      isArchived: false,
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() }
    });

    // Tasks due this week
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const dueThisWeek = await Task.countDocuments({
      project: { $in: projectIds },
      isArchived: false,
      status: { $ne: 'completed' },
      dueDate: { $gte: today, $lte: weekEnd }
    });

    // Format statistics
    const formatStats = (stats, keys) => {
      const result = {};
      keys.forEach(key => { result[key] = 0; });
      stats.forEach(s => { result[s._id] = s.count; });
      result.total = Object.values(result).reduce((a, b) => a + b, 0);
      return result;
    };

    const formattedProjectStats = formatStats(projectStats, 
      ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled']);
    
    const formattedTaskStats = formatStats(taskStats,
      ['todo', 'in-progress', 'in-review', 'completed']);
    
    const formattedMyTaskStats = formatStats(myTaskStats,
      ['todo', 'in-progress', 'in-review', 'completed']);
    
    const formattedPriorityStats = formatStats(priorityStats,
      ['low', 'medium', 'high', 'critical']);

    res.status(200).json({
      success: true,
      data: {
        projects: formattedProjectStats,
        tasks: formattedTaskStats,
        myTasks: formattedMyTaskStats,
        priority: formattedPriorityStats,
        overdue: overdueCount,
        dueThisWeek
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};

/**
 * @desc    Get recent activity
 * @route   GET /api/dashboard/activity
 * @access  Private
 */
exports.getActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;

    // Get user's projects
    const userProjects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);

    // Get recent tasks (created or updated)
    const recentTasks = await Task.find({
      project: { $in: projectIds }
    })
      .populate('creator', 'name avatar')
      .populate('assignee', 'name avatar')
      .populate('project', 'name color')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit, 10))
      .select('title status updatedAt createdAt creator assignee project');

    // Format as activity feed
    const activity = recentTasks.map(task => ({
      id: task._id,
      type: 'task',
      title: task.title,
      status: task.status,
      project: task.project,
      user: task.creator,
      assignee: task.assignee,
      timestamp: task.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: { activity }
    });

  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity'
    });
  }
};

/**
 * @desc    Get upcoming deadlines
 * @route   GET /api/dashboard/deadlines
 * @access  Private
 */
exports.getDeadlines = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const userId = req.user.id;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days, 10));

    // Get tasks assigned to user with upcoming deadlines
    const upcomingTasks = await Task.find({
      assignee: userId,
      isArchived: false,
      status: { $ne: 'completed' },
      dueDate: { $lte: endDate }
    })
      .populate('project', 'name color')
      .sort({ dueDate: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: { tasks: upcomingTasks }
    });

  } catch (error) {
    console.error('Get deadlines error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deadlines'
    });
  }
};

/**
 * @desc    Get team performance (for managers/admins)
 * @route   GET /api/dashboard/team-performance
 * @access  Private (Manager/Admin)
 */
exports.getTeamPerformance = async (req, res) => {
  try {
    // Get all active users with their task counts
    const teamPerformance = await User.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'assignee',
          as: 'tasks'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          avatar: 1,
          department: 1,
          totalTasks: { $size: '$tasks' },
          completedTasks: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 'task',
                cond: { $eq: ['$$task.status', 'completed'] }
              }
            }
          },
          inProgressTasks: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 'task',
                cond: { $eq: ['$$task.status', 'in-progress'] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $eq: ['$totalTasks', 0] },
              0,
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] }
            ]
          }
        }
      },
      {
        $sort: { completedTasks: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      success: true,
      data: { performance: teamPerformance }
    });

  } catch (error) {
    console.error('Get team performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team performance'
    });
  }
};
