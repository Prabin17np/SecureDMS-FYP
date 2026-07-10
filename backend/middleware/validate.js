// Centralizes all input validation for the auth routes. Keeping
// this separate from the controller means every route gets the
// same sanitization rules applied consistently, and the controller
// code never has to worry about malformed input reaching the DB layer.

const { body, validationResult } = require('express-validator');

// Registration rules
function registerValidationRules() {
  return [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters.')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username may only contain letters, numbers, and underscores.'),

    body('email')
      .trim()
      .isEmail()
      .withMessage('A valid email address is required.')
      .normalizeEmail(),

    body('full_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters.')
      .matches(/^[a-zA-Z\s.'-]+$/)
      .withMessage('Full name contains invalid characters.'),

    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter.')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter.')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number.')
      .matches(/[^A-Za-z0-9]/)
      .withMessage('Password must contain at least one special character.'),
  ];
}

// Login rules
function loginValidationRules() {
  return [
    body('email')
      .trim()
      .isEmail()
      .withMessage('A valid email address is required.')
      .normalizeEmail(),

    body('password')
      .notEmpty()
      .withMessage('Password is required.'),
      // Intentionally NOT checking password complexity/length here.
      // Login should only ever say "invalid credentials" - leaking
      // "your password doesn't meet complexity rules" on login
      // could help an attacker learn things about password policy
      // vs. an actual account. Complexity is enforced at registration.
  ];
}
// Shared error handler
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Return only field + message, never raw request data or stack traces.
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: formatted,
    });
  }

  next();
}

module.exports = {
  registerValidationRules,
  loginValidationRules,
  handleValidationErrors,
};