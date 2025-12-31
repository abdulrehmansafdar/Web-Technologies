/**
 * ===========================================
 * Authentication Middleware
 * ===========================================
 * 
 * Middleware functions for JWT authentication and role-based authorization.
 * Protects routes and ensures only authorized users can access them.
 * 
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Protect Routes Middleware
 * 
 * Verifies JWT token and attaches user to request object.
 * Use this middleware to protect routes that require authentication.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    // Format: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID from token payload
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token may be invalid.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated. Please contact support.'
        });
      }

      // Attach user to request object for use in route handlers
      req.user = user;
      next();

    } catch (error) {
      // Token verification failed
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or has expired. Please login again.'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

/**
 * Role-Based Authorization Middleware
 * 
 * Restricts access to routes based on user roles.
 * Use after the protect middleware.
 * 
 * @param {...string} roles - Allowed roles for the route
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Only admins can access this route
 * router.get('/admin', protect, authorize('admin'), adminController);
 * 
 * // Admins and managers can access
 * router.get('/manage', protect, authorize('admin', 'manager'), manageController);
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

/**
 * Optional Authentication Middleware
 * 
 * Similar to protect, but doesn't block if no token is provided.
 * Useful for routes that have different behavior for authenticated vs anonymous users.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but we continue anyway for optional auth
        console.log('Optional auth: Invalid token, continuing as anonymous');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
