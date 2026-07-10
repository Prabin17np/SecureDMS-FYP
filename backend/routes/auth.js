// Defines the auth endpoints. No business logic here on purpose —
// this file should be readable top-to-bottom as a map of "what auth
// actions exist" without needing to dig into implementation details.

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { registerValidationRules, loginValidationRules, handleValidationErrors } = require('../middleware/validate');

// POST /api/auth/register
// Validation runs first; if it fails, handleValidationErrors short-circuits
// the request before it ever reaches the controller/DB.
router.post(
  '/register',
  registerValidationRules(),
  handleValidationErrors,
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  loginValidationRules(),
  handleValidationErrors,
  authController.login
);

// POST /api/auth/logout
// No body to validate — just needs an active session, which the
// controller checks itself.
router.post('/logout', authController.logout);

module.exports = router;