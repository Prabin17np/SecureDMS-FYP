// backend/services/userService.js
// User profile and account management - separate from authService which
// handles registration/login. Ownership is enforced at the DB level or


const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { logActivity } = require('./authService');

// OWASP A01 (Broken Access Control): user can only fetch their own profile
// unless explicitly called by admin code (which you'd guard with isAdmin middleware).
async function getUserProfile(userId) {
  const result = await pool.query(
    `SELECT id, username, email, full_name, role, totp_enabled, created_at, updated_at
     FROM users
     WHERE id = $1 AND is_active = TRUE`,
    [userId]
  );
  return result.rows[0] || null;
}

// OWASP A01: user updates only their own profile fields. email uniqueness
// is re-checked (allows email to stay the same, or change to a new one).
// username is NOT editable (identity anchor), password has its own endpoint.
async function updateUserProfile(userId, { fullName, email }, ipAddress) {
  if (!fullName || !email) {
    return { success: false, message: 'Full name and email are required.' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = fullName.trim();

  // Check email uniqueness UNLESS it's the same as current
  const currentUser = await getUserProfile(userId);
  if (currentUser.email !== trimmedEmail) {
    const emailExists = await pool.query(`SELECT id FROM users WHERE email = $1`, [trimmedEmail]);
    if (emailExists.rows.length > 0) {
      return { success: false, message: 'Email is already in use.' };
    }
  }

  const result = await pool.query(
    `UPDATE users SET full_name = $1, email = $2, updated_at = NOW()
     WHERE id = $3 AND is_active = TRUE
     RETURNING id, username, email, full_name, role, totp_enabled, created_at, updated_at`,
    [trimmedName, trimmedEmail, userId]
  );

  if (result.rows.length === 0) {
    return { success: false, message: 'User not found.' };
  }

  await logActivity({
    userId,
    actionType: 'password_change', // reusing for profile update too (could add new type)
    description: `Updated profile - name or email changed`,
    ipAddress,
  });

  return { success: true, user: result.rows[0] };
}

// OWASP A07 (Identification and Authentication Failures): password change
// requires the OLD password first (prevents account takeover via unattended session).
// Uses bcrypt (same as register/login).
async function changePassword(userId, oldPassword, newPassword, ipAddress) {
  if (!oldPassword || !newPassword) {
    return { success: false, message: 'Both old and new password are required.' };
  }

  // Fetch the user's current password hash
  const userResult = await pool.query(
    `SELECT password_hash FROM users WHERE id = $1 AND is_active = TRUE`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    return { success: false, message: 'User not found.' };
  }

  const currentHash = userResult.rows[0].password_hash;

  // Verify old password against current hash
  const oldPasswordValid = await bcrypt.compare(oldPassword, currentHash);
  if (!oldPasswordValid) {
    return { success: false, message: 'Current password is incorrect.' };
  }

  // Hash the new password and update
  const SALT_ROUNDS = 12;
  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await pool.query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [newHash, userId]
  );

  await logActivity({
    userId,
    actionType: 'password_change',
    description: 'Changed password',
    ipAddress,
  });

  return { success: true, message: 'Password changed successfully.' };
}

// User views their own activity log (readable history of what they've done:
// login, logout, upload, delete, etc. - see activity_logs table).
async function getUserActivityLog(userId, limit = 50) {
  const result = await pool.query(
    `SELECT id, action_type, description, ip_address, created_at
     FROM activity_logs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

// ADMIN ONLY (enforced by route middleware, not here): list all users.
// Excludes sensitive fields like password_hash.
async function getAllUsers() {
  const result = await pool.query(
    `SELECT id, username, email, full_name, role, totp_enabled, is_active, created_at, last_login
     FROM users
     ORDER BY created_at DESC`
  );
  return result.rows;
}

// ADMIN ONLY: get a single user's profile (for admin viewing details).
// Includes more info than getUserProfile (e.g. is_active status).
async function getUserById(userId) {
  const result = await pool.query(
    `SELECT id, username, email, full_name, role, totp_enabled, is_active, created_at, last_login, updated_at
     FROM users
     WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

// ADMIN ONLY: soft-delete a user (is_active = FALSE).
async function deactivateUser(userId, adminId, ipAddress) {
  const user = await getUserById(userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  if (userId === adminId) {
    return { success: false, message: 'Cannot deactivate your own account.' };
  }

  await pool.query(`UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, [userId]);

  await logActivity({
    userId: adminId,
    actionType: 'password_change', // reusing (could add new type)
    description: `Deactivated user account: ${user.username} (id: ${user.id})`,
    ipAddress,
  });

  return { success: true };
}
// ADMIN ONLY: reactivate a deactivated user
async function reactivateUser(userId, adminId, ipAddress) {
  const user = await getUserById(userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  await pool.query(
    `UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE id = $1`,
    [userId]
  );

  await logActivity({
    userId: adminId,
    actionType: 'password_change', // reusing existing type
    description: `Reactivated user account: ${user.username} (id: ${user.id})`,
    ipAddress,
  });

  return { success: true };
}

// Get activity log for a specific user (admin view). Same data as
// getUserActivityLog, but called from admin context.
async function getUserActivityLogAdmin(userId, limit = 100) {
  const result = await pool.query(
    `SELECT id, action_type, description, ip_address, created_at
     FROM activity_logs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

// Store TOTP secret when user enrolls in 2FA (called from auth/totp setup endpoint)
async function enableTOTP(userId, secret) {
  const result = await pool.query(
    `UPDATE users SET totp_secret = $1, totp_enabled = TRUE, updated_at = NOW()
     WHERE id = $2 AND is_active = TRUE
     RETURNING id, username, totp_enabled`,
    [secret, userId]
  );
  return result.rows[0] || null;
}

// Remove 2FA from user account (they disable it in their settings)
async function disableTOTP(userId) {
  const result = await pool.query(
    `UPDATE users SET totp_secret = NULL, totp_enabled = FALSE, updated_at = NOW()
     WHERE id = $1 AND is_active = TRUE
     RETURNING id, username, totp_enabled`,
    [userId]
  );
  return result.rows[0] || null;
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserActivityLog,
  getAllUsers,
  getUserById,
  deactivateUser,
  reactivateUser,
  getUserActivityLogAdmin,
  enableTOTP,
  disableTOTP,
};