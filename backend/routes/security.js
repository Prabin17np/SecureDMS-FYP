const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const pool = require('../config/db');

// GET /api/security/failed-logins - admin: view failed login attempts
router.get('/failed-logins', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM failed_logins ORDER BY attempted_at DESC LIMIT 100`
    );
    return res.status(200).json({ success: true, failedLogins: result.rows });
  } catch (err) {
    console.error('Get failed logins error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not retrieve failed logins.' });
  }
});

// GET /api/security/locked-accounts - admin: view locked user accounts
router.get('/locked-accounts', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, is_locked, locked_until 
       FROM users 
       WHERE is_locked = TRUE 
       ORDER BY locked_until DESC`
    );
    return res.status(200).json({ success: true, lockedAccounts: result.rows });
  } catch (err) {
    console.error('Get locked accounts error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not retrieve locked accounts.' });
  }
});

// POST /api/security/unlock/:userId - admin: unlock a locked account
router.post('/unlock/:userId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }

    await pool.query(
      `UPDATE users SET failed_attempts = 0, is_locked = FALSE, locked_until = NULL WHERE id = $1`,
      [userId]
    );

    return res.status(200).json({ success: true, message: 'Account unlocked.' });
  } catch (err) {
    console.error('Unlock account error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not unlock account.' });
  }
});

module.exports = router;