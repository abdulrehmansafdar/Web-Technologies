/**
 * ===========================================
 * Comment Controller
 * ===========================================
 * 
 * Handles comment operations on tasks:
 * - Create, read, update, delete comments
 * - Add reactions to comments
 * - Reply to comments (threading)
 * 
 * @module controllers/comment
 */

const Comment = require('../models/Comment.model');
const Task = require('../models/Task.model');

/**
 * @desc    Get comments for a task
 * @route   GET /api/comments/task/:taskId
 * @access  Private
 */
exports.getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get top-level comments (not replies)
    const comments = await Comment.find({
      task: taskId,
      isDeleted: false,
      parentComment: null
    })
      .populate('author', 'name email avatar')
      .populate({
        path: 'replies',
        match: { isDeleted: false },
        populate: { path: 'author', select: 'name email avatar' },
        options: { sort: { createdAt: 1 } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Total count
    const total = await Comment.countDocuments({
      task: taskId,
      isDeleted: false,
      parentComment: null
    });

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
};

/**
 * @desc    Create comment
 * @route   POST /api/comments
 * @access  Private
 */
exports.createComment = async (req, res) => {
  try {
    const { content, taskId, parentCommentId, mentions } = req.body;

    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify parent comment if it's a reply
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    // Create comment
    const comment = await Comment.create({
      content,
      task: taskId,
      author: req.user.id,
      parentComment: parentCommentId || null,
      mentions: mentions || []
    });

    // Populate author
    await comment.populate('author', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Comment added',
      data: { comment }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating comment'
    });
  }
};

/**
 * @desc    Update comment
 * @route   PUT /api/comments/:id
 * @access  Private
 */
exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;

    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only author can update
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    await comment.populate('author', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Comment updated',
      data: { comment }
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment'
    });
  }
};

/**
 * @desc    Delete comment (soft delete)
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only author or admin can delete
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.content = '[This comment has been deleted]';
    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment'
    });
  }
};

/**
 * @desc    Add reaction to comment
 * @route   POST /api/comments/:id/reactions
 * @access  Private
 */
exports.addReaction = async (req, res) => {
  try {
    const { type = 'like' } = req.body;

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user already reacted
    const existingReaction = comment.reactions.find(
      r => r.user.toString() === req.user.id
    );

    if (existingReaction) {
      // Update existing reaction
      existingReaction.type = type;
    } else {
      // Add new reaction
      comment.reactions.push({ user: req.user.id, type });
    }

    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Reaction added',
      data: { reactions: comment.reactions }
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reaction'
    });
  }
};

/**
 * @desc    Remove reaction from comment
 * @route   DELETE /api/comments/:id/reactions
 * @access  Private
 */
exports.removeReaction = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Remove user's reaction
    comment.reactions = comment.reactions.filter(
      r => r.user.toString() !== req.user.id
    );

    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Reaction removed',
      data: { reactions: comment.reactions }
    });

  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing reaction'
    });
  }
};
