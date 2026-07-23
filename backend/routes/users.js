// backend/routes/users.js
// User profile and admin account management endpoints. All routes require
// isAuthenticated first. Routes with "admin" in the description additionally
// require isAdmin (chained middleware).

const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// GET /api/users/profile - view own profile
router.get('/profile', isAuthenticated, userController.getOwnProfile);

// PUT /api/users/profile - update own profile (name, email)
router.put('/profile', isAuthenticated, userController.updateOwnProfile);

// POST /api/users/change-password - change own password (old + new)
router.post('/change-password', isAuthenticated, userController.changePassword);

// GET /api/users/activity - view own activity log
router.get('/activity', isAuthenticated, userController.getOwnActivityLog);
// POST /api/users/:id/reactivate - admin: reactivate a user
router.post('/:id/reactivate', isAuthenticated, isAdmin, userController.reactivateUser);
// GET /api/users - admin: list all users
router.get('/', isAuthenticated, isAdmin, userController.listAllUsers);

// GET /api/users/:id - admin: view specific user's profile
router.get('/:id', isAuthenticated, isAdmin, userController.getUserDetails);

// GET /api/users/:id/activity - admin: view specific user's activity log
router.get('/:id/activity', isAuthenticated, isAdmin, userController.getUserActivityLogAdmin);

// DELETE /api/users/:id - admin: deactivate a user
router.delete('/:id', isAuthenticated, isAdmin, userController.deactivateUser);




module.exports = router;