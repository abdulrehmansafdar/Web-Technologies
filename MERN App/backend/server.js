/**
 * ===========================================
 * TaskFlow - Task/Project Management System
 * Main Server Entry Point
 * ===========================================
 * 
 * This is the main entry point for the TaskFlow backend server.
 * It initializes Express, connects to MongoDB, and sets up all middleware and routes.
 * 
 * @author Abdul Rehman
 * @version 1.0.0
 */

// Import required dependencies
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

// Initialize Express application
const app = express();

// ===========================================
// MIDDLEWARE CONFIGURATION
// ===========================================

/**
 * CORS Middleware
 * Enables Cross-Origin Resource Sharing to allow frontend to communicate with backend
 * This is essential for MERN stack applications where frontend and backend run on different ports
 */
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://frontend:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Body Parser Middleware
 * Parses incoming JSON requests and makes data available in req.body
 */
app.use(express.json({ limit: '10mb' }));

/**
 * URL Encoded Parser
 * Parses URL-encoded data (form submissions)
 */
app.use(express.urlencoded({ extended: true }));

/**
 * Static Files Middleware
 * Serves uploaded files from the 'uploads' directory
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===========================================
// API ROUTES
// ===========================================

/**
 * Health Check Route
 * Used to verify the server is running (useful for Docker health checks)
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TaskFlow API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */
app.use('/api/auth', require('./routes/auth.routes'));

/**
 * User Routes
 * Handles user CRUD operations and team member management
 */
app.use('/api/users', require('./routes/user.routes'));

/**
 * Project Routes
 * Handles project creation, updates, and management
 */
app.use('/api/projects', require('./routes/project.routes'));

/**
 * Task Routes
 * Handles task CRUD operations within projects
 */
app.use('/api/tasks', require('./routes/task.routes'));

/**
 * Comment Routes
 * Handles comments on tasks for team collaboration
 */
app.use('/api/comments', require('./routes/comment.routes'));

/**
 * Dashboard Routes
 * Provides analytics and summary data for the dashboard
 */
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// ===========================================
// ERROR HANDLING
// ===========================================

/**
 * 404 Handler
 * Catches requests to undefined routes
 */
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

/**
 * Global Error Handler
 * Catches and processes all errors thrown in the application
 */
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===========================================
// SERVER INITIALIZATION
// ===========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 TaskFlow Server is Running!                         ║
  ║                                                           ║
  ║   📡 Port: ${PORT}                                          ║
  ║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                          ║
  ║   📅 Started: ${new Date().toLocaleString()}              
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

module.exports = app;
