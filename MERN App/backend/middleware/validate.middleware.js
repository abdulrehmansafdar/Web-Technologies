/**
 * ===========================================
 * Validation Middleware
 * ===========================================
 * 
 * Request validation middleware using express-validator.
 * Validates incoming request data before processing.
 * 
 * @module middleware/validate
 */

const { validationResult } = require('express-validator');

/**
 * Validation Result Handler
 * 
 * Checks for validation errors and returns appropriate response.
 * Use after validation chain in routes.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * 
 * @example
 * router.post('/users',
 *   [body('email').isEmail(), body('password').isLength({ min: 6 })],
 *   validate,
 *   createUser
 * );
 */
const validate = (req, res, next) => {
  // Get validation errors from request
  const errors = validationResult(req);

  // If no errors, proceed to next middleware
  if (errors.isEmpty()) {
    return next();
  }

  // Format errors for response
  const formattedErrors = errors.array().map(error => ({
    field: error.path,
    message: error.msg,
    value: error.value
  }));

  // Return 400 Bad Request with error details
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: formattedErrors
  });
};

module.exports = validate;
