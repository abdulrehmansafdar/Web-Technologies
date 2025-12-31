/**
 * ===========================================
 * Models Index - Export All Models
 * ===========================================
 * 
 * Central export point for all Mongoose models.
 * Makes importing models cleaner throughout the application.
 * 
 * @module models
 */

const User = require('./User.model');
const Project = require('./Project.model');
const Task = require('./Task.model');
const Comment = require('./Comment.model');

module.exports = {
  User,
  Project,
  Task,
  Comment
};
