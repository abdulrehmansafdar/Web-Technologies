/**
 * ===========================================
 * Project Controller
 * ===========================================
 * 
 * Handles project management operations:
 * - Create, read, update, delete projects
 * - Manage project members
 * - Project filtering and searching
 * 
 * @module controllers/project
 */

const Project = require('../models/Project.model');
const Task = require('../models/Task.model');

/**
 * @desc    Get all projects for current user
 * @route   GET /api/projects
 * @access  Private
 * 
 * Returns projects where user is owner or member.
 * Supports pagination, filtering, and searching.
 */
exports.getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      archived = 'false'
    } = req.query;

    // Build query - get projects where user is owner or member
    const query = {
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ],
      isArchived: archived === 'true'
    };

    // Search by name or description
    if (search) {
      query.$and = [
        { $or: query.$or },
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
          ]
        }
      ];
      delete query.$or;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get task counts for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskStats = await Task.aggregate([
          { $match: { project: project._id, isArchived: false } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        // Format task stats
        const stats = {
          total: 0,
          todo: 0,
          'in-progress': 0,
          'in-review': 0,
          completed: 0
        };

        taskStats.forEach(s => {
          stats[s._id] = s.count;
          stats.total += s.count;
        });

        return {
          ...project.toObject(),
          taskStats: stats,
          progress: stats.total > 0 
            ? Math.round((stats.completed / stats.total) * 100) 
            : 0
        };
      })
    );

    // Total count
    const total = await Project.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        projects: projectsWithStats,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum,
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects'
    });
  }
};

/**
 * @desc    Get single project
 * @route   GET /api/projects/:id
 * @access  Private
 */
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access
    if (!project.isMember(req.user.id) && !project.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
    }

    // Get task statistics
    const taskStats = await Task.aggregate([
      { $match: { project: project._id, isArchived: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: 0,
      todo: 0,
      'in-progress': 0,
      'in-review': 0,
      completed: 0
    };

    taskStats.forEach(s => {
      stats[s._id] = s.count;
      stats.total += s.count;
    });

    res.status(200).json({
      success: true,
      data: {
        project: {
          ...project.toObject(),
          taskStats: stats,
          progress: stats.total > 0 
            ? Math.round((stats.completed / stats.total) * 100) 
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Get project error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching project'
    });
  }
};

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Private
 */
exports.createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      status,
      priority,
      startDate,
      dueDate,
      tags,
      color,
      members,
      budget,
      isPublic
    } = req.body;

    // Create project with current user as owner
    const project = await Project.create({
      name,
      description,
      status: status || 'planning',
      priority: priority || 'medium',
      owner: req.user.id,
      startDate: startDate || new Date(),
      dueDate,
      tags: tags || [],
      color: color || '#3B82F6',
      members: members || [],
      budget,
      isPublic: isPublic || false
    });

    // Populate owner details
    await project.populate('owner', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check ownership or admin member role
    const member = project.members.find(
      m => m.user.toString() === req.user.id
    );
    const isOwner = project.owner.toString() === req.user.id;
    const isAdmin = member && member.role === 'admin';

    if (!isOwner && !isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'name', 'description', 'status', 'priority',
      'startDate', 'dueDate', 'tags', 'color', 'budget', 'isPublic', 'isArchived'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project'
    });
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only owner or admin can delete
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project'
      });
    }

    // Delete all tasks in the project
    await Task.deleteMany({ project: project._id });

    // Delete the project
    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project and all related tasks deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project'
    });
  }
};

/**
 * @desc    Add member to project
 * @route   POST /api/projects/:id/members
 * @access  Private
 */
exports.addMember = async (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has permission
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add members'
      });
    }

    // Check if user is already a member
    const existingMember = project.members.find(
      m => m.user.toString() === userId
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    // Add member
    project.members.push({ user: userId, role });
    await project.save();

    // Populate and return
    await project.populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      data: { members: project.members }
    });

  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding member'
    });
  }
};

/**
 * @desc    Remove member from project
 * @route   DELETE /api/projects/:id/members/:userId
 * @access  Private
 */
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check permission
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove members'
      });
    }

    // Cannot remove owner
    if (req.params.userId === project.owner.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project owner'
      });
    }

    // Remove member
    project.members = project.members.filter(
      m => m.user.toString() !== req.params.userId
    );
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member'
    });
  }
};
