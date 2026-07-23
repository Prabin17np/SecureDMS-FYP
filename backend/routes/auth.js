const express = require('express');
const rateLimit = require('express-rate-limit'); // Import the express-rate-limit package
const router = express.Router();

const authController = require('../controllers/authController');
const { registerValidationRules, loginValidationRules, handleValidationErrors } = require('../middleware/validate');
const { isAuthenticated } = require('../middleware/auth');

// Rate limiter for login: max 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // max 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,  
});

// Rate limiter for registration: max 5 attempts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,  // max 5 requests per hour
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/register
router.post(
  '/register',
  registerLimiter,
  registerValidationRules(),
  handleValidationErrors,
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  loginValidationRules(),
  handleValidationErrors,
  authController.login
);

// POST /api/auth/logout
router.post('/logout', authController.logout);
// GET /api/auth/me
router.get('/me', isAuthenticated, authController.getCurrentUser);

module.exports = router;