// backend/controllers/userController.js
//
// HTTP layer for user account management. Assumes isAuthenticated has
// already run (req.session.userId exists). Admin routes additionally
// assume isAdmin middleware ran.

const userService = require('../services/userService');

// GET /api/users/profile
// Authenticated user views their own profile.
exports.getOwnProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.session.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Get profile error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not retrieve profile.' });
  }
};

// PUT /api/users/profile
// Authenticated user updates their own name and email.
exports.updateOwnProfile = async (req, res) => {
  try {
    const { fullName, email } = req.body;

    const result = await userService.updateUserProfile(
      req.session.userId,
      { fullName, email },
      req.ip
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: result.user,
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update profile.' });
  }
};

// POST /api/users/change-password
// Authenticated user changes their password (requires old password verification).
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old and new passwords are required.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters.',
      });
    }

    const result = await userService.changePassword(
      req.session.userId,
      oldPassword,
      newPassword,
      req.ip
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    console.error('Change password error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not change password.' });
  }
};

// GET /api/users/activity
// Authenticated user views their own activity log.
exports.getOwnActivityLog = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || 50, 10), 200); // cap at 200
    const activityLog = await userService.getUserActivityLog(req.session.userId, limit);
    return res.status(200).json({ success: true, activityLog });
  } catch (err) {
    console.error('Get activity log error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not retrieve activity log.' });
  }
};

// GET /api/users
// Admin views all users (list with basic info, no password hashes).
exports.listAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json({ success: true, users });
  } catch (err) {
    console.error('List users error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not retrieve users.' });
  }
};

// GET /api/users/:id
// Admin views a specific user's profile details.
exports.getUserDetails = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Get user details error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not retrieve user details.' });
  }
};

// GET /api/users/:id/activity
// Admin views a specific user's activity log.
exports.getUserActivityLogAdmin = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }

    const limit = Math.min(parseInt(req.query.limit || 100, 10), 500); // cap at 500
    const activityLog = await userService.getUserActivityLogAdmin(userId, limit);
    return res.status(200).json({ success: true, activityLog });
  } catch (err) {
    console.error('Get user activity log error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not retrieve activity log.' });
  }
};

// DELETE /api/users/:id
// Admin deactivates a user (soft delete - prevents login but keeps audit trail).
exports.deactivateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }

    const result = await userService.deactivateUser(userId, req.session.userId, req.ip);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: 'User deactivated successfully.',
    });
  } catch (err) {
    console.error('Deactivate user error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not deactivate user.' });
  }
};
// POST /api/users/:id/reactivate - admin: reactivate a user
exports.reactivateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }

    const result = await userService.reactivateUser(userId, req.session.userId, req.ip);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: 'User reactivated successfully.',
    });
  } catch (err) {
    console.error('Reactivate user error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not reactivate user.' });
  }
};