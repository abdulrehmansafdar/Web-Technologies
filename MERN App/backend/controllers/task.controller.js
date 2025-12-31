/**
 * ===========================================
 * Task Controller
 * ===========================================
 * 
 * Handles task management operations:
 * - Create, read, update, delete tasks
 * - Task assignment and status updates
 * - Subtask management
 * - File attachments
 * 
 * @module controllers/task
 */

const Task = require('../models/Task.model');
const Project = require('../models/Project.model');

/**
 * @desc    Get all tasks (with filters)
 * @route   GET /api/tasks
 * @access  Private
 * 
 * Supports filtering by project, status, assignee, priority
 */
exports.getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      project,
      status,
      priority,
      assignee,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dueDate,
      overdue
    } = req.query;

    // Build query
    const query = { isArchived: false };

    // Filter by project
    if (project) {
      query.project = project;
    }

    // Filter by status (can be comma-separated)
    if (status) {
      const statuses = status.split(',');
      query.status = { $in: statuses };
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by assignee
    if (assignee) {
      if (assignee === 'me') {
        query.assignee = req.user.id;
      } else if (assignee === 'unassigned') {
        query.assignee = null;
      } else {
        query.assignee = assignee;
      }
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filter by due date
    if (dueDate) {
      const date = new Date(dueDate);
      query.dueDate = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      };
    }

    // Filter overdue tasks
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'completed' };
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const tasks = await Task.find(query)
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('project', 'name color')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Total count
    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        tasks,
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
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
};

/**
 * @desc    Get tasks by project (Kanban board view)
 * @route   GET /api/tasks/project/:projectId
 * @access  Private
 * 
 * Returns tasks grouped by status for Kanban display
 */
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project access
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.isMember(req.user.id) && !project.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this project'
      });
    }

    // Get all tasks for the project
    const tasks = await Task.find({ project: projectId, isArchived: false })
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .sort({ order: 1, createdAt: -1 });

    // Group by status for Kanban board
    const grouped = {
      'todo': [],
      'in-progress': [],
      'in-review': [],
      'completed': []
    };

    tasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        tasks: grouped,
        total: tasks.length
      }
    });

  } catch (error) {
    console.error('Get tasks by project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
};

/**
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('project', 'name color owner members')
      .populate('watchers', 'name email avatar')
      .populate('dependencies', 'title status');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { task }
    });

  } catch (error) {
    console.error('Get task error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching task'
    });
  }
};

/**
 * @desc    Create new task
 * @route   POST /api/tasks
 * @access  Private
 */
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      status,
      priority,
      assignee,
      startDate,
      dueDate,
      estimatedHours,
      tags,
      subtasks
    } = req.body;

    // Verify project exists and user has access
    const projectDoc = await Project.findById(project);
    
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!projectDoc.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create tasks in this project'
      });
    }

    // Get highest order number for the status column
    const highestOrder = await Task.findOne({ project, status: status || 'todo' })
      .sort({ order: -1 })
      .select('order');

    // Create task
    const task = await Task.create({
      title,
      description,
      project,
      creator: req.user.id,
      status: status || 'todo',
      priority: priority || 'medium',
      assignee,
      startDate,
      dueDate,
      estimatedHours,
      tags: tags || [],
      subtasks: subtasks || [],
      order: highestOrder ? highestOrder.order + 1 : 0,
      watchers: [req.user.id] // Creator watches by default
    });

    // Populate for response
    await task.populate([
      { path: 'assignee', select: 'name email avatar' },
      { path: 'creator', select: 'name email avatar' },
      { path: 'project', select: 'name color' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Allowed fields to update
    const allowedFields = [
      'title', 'description', 'status', 'priority',
      'assignee', 'startDate', 'dueDate', 'estimatedHours',
      'actualHours', 'tags', 'order', 'isArchived'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('project', 'name color');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task'
    });
  }
};

/**
 * @desc    Update task status (drag and drop)
 * @route   PATCH /api/tasks/:id/status
 * @access  Private
 */
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, order } = req.body;

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update status and order
    task.status = status;
    if (order !== undefined) {
      task.order = order;
    }
    await task.save();

    await task.populate([
      { path: 'assignee', select: 'name email avatar' },
      { path: 'project', select: 'name color' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Task status updated',
      data: { task }
    });

  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task status'
    });
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
};

/**
 * @desc    Add subtask
 * @route   POST /api/tasks/:id/subtasks
 * @access  Private
 */
exports.addSubtask = async (req, res) => {
  try {
    const { title } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.subtasks.push({ title });
    await task.save();

    res.status(201).json({
      success: true,
      message: 'Subtask added',
      data: { subtasks: task.subtasks }
    });

  } catch (error) {
    console.error('Add subtask error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding subtask'
    });
  }
};

/**
 * @desc    Toggle subtask completion
 * @route   PATCH /api/tasks/:id/subtasks/:subtaskId
 * @access  Private
 */
exports.toggleSubtask = async (req, res) => {
  try {
    const { id, subtaskId } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const subtask = task.subtasks.id(subtaskId);

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    subtask.isCompleted = !subtask.isCompleted;
    subtask.completedAt = subtask.isCompleted ? new Date() : undefined;
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Subtask toggled',
      data: { subtasks: task.subtasks }
    });

  } catch (error) {
    console.error('Toggle subtask error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling subtask'
    });
  }
};

/**
 * @desc    Delete subtask
 * @route   DELETE /api/tasks/:id/subtasks/:subtaskId
 * @access  Private
 */
exports.deleteSubtask = async (req, res) => {
  try {
    const { id, subtaskId } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.subtasks = task.subtasks.filter(
      st => st._id.toString() !== subtaskId
    );
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Subtask deleted',
      data: { subtasks: task.subtasks }
    });

  } catch (error) {
    console.error('Delete subtask error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting subtask'
    });
  }
};

/**
 * @desc    Get my tasks
 * @route   GET /api/tasks/my-tasks
 * @access  Private
 */
exports.getMyTasks = async (req, res) => {
  try {
    const { status, priority, limit = 10 } = req.query;

    const query = {
      assignee: req.user.id,
      isArchived: false
    };

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    const tasks = await Task.find(query)
      .populate('project', 'name color')
      .sort({ dueDate: 1, priority: -1 })
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: { tasks }
    });

  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
};
