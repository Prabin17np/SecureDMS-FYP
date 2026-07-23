
// This layer only knows about req/res/session. It delegates all
// DB work, hashing, and lockout rules to authService. That keeps
// this file readable as "what happens on this HTTP call" without
// mixing in SQL or bcrypt details.
//
// IMPORTANT: authService is implemented in the next step. The
// function calls below are already API-shaped ready for it.

const authService = require('../services/authService');

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, full_name, password } = req.body;

    const result = await authService.registerUser({ username, email, full_name, password });

    if (!result.success) {
      // result.reason is a safe, generic message (e.g. "duplicate").
      // We never leak DB error details or which field caused the conflict
      // in a way that helps an attacker enumerate accounts.
      return res.status(409).json({ success: false, message: result.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now log in.',
    });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip;

  try {
    const result = await authService.loginUser({ email, password, ipAddress });

    if (!result.success) {
      // Covers: user not found, wrong password, account locked.
      // Message is intentionally generic and status code is always 401
      // (or 403 for locked) so responses don't reveal which case occurred.
      const statusCode = result.locked ? 403 : 401;
      return res.status(statusCode).json({ success: false, message: result.message });
    }

    // Regenerate the session on login to prevent session fixation attacks.
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regenerate error:', err.message);
        return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
      }

      req.session.userId = result.user.id;
      req.session.role = result.user.role;

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        user: {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role,
        },
      });
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
  }
};

// GET /api/auth/me
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await authService.getUserById(req.session.userId);

    if (!user) {
      // Session points to a user that no longer exists - clear it
      // rather than leaving a dangling session alive.
      req.session.destroy(() => {});
      return res.status(401).json({ success: false, message: 'Session is no longer valid.' });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Get current user error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not verify session.' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(400).json({ success: false, message: 'No active session.' });
  }

  const userId = req.session.userId;

  req.session.destroy(async (err) => {
    if (err) {
      console.error('Logout error:', err.message);
      return res.status(500).json({ success: false, message: 'Logout failed.' });
    }

    // Fire-and-log: logout is recorded even though the session is already gone.
    try {
      await authService.logActivity({
        userId,
        actionType: 'logout',
        description: 'User logged out',
        ipAddress: req.ip,
      });
    } catch (logErr) {
      console.error('Activity log error:', logErr.message);
      // Don't fail the logout response just because logging failed.
    }

    res.clearCookie('connect.sid');
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  });
};