
// All database queries, bcrypt hashing/comparison, and account
// lockout rules live here. Nothing in this file knows about
// req/res — it only takes plain data in and returns plain
// result objects, so it can be tested or reused (e.g. by an
// admin "unlock user" endpoint later) without touching HTTP code.

const bcrypt = require('bcrypt');
const pool = require('../config/db');

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

// Registration
async function registerUser({ username, email, full_name, password }) {
  // Check for existing username/email in one query (parameterized —
  // values never get concatenated into the SQL string).
  const existing = await pool.query(
    'SELECT id FROM users WHERE username = $1 OR email = $2',
    [username, email]
  );

  if (existing.rows.length > 0) {
    // Deliberately generic: we don't say *which* field conflicted,
    // so this endpoint can't be used to enumerate valid emails/usernames.
    return { success: false, message: 'Username or email is already registered.' };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await pool.query(
    `INSERT INTO users (username, email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4, 'user')`,
    [username, email, passwordHash, full_name]
  );

  return { success: true };
}

// Login
async function loginUser({ email, password, ipAddress }) {
  const userResult = await pool.query(
    `SELECT id, username, email, password_hash, role,
            failed_attempts, is_locked, locked_until
     FROM users WHERE email = $1`,
    [email]
  );

  if (userResult.rows.length === 0) {
    await logFailedLogin({ attemptedUsername: email, ipAddress, reason: 'no such user' });
    return { success: false, message: 'Invalid email or password.' };
  }

  const user = userResult.rows[0];

  // Lockout check 
  if (user.is_locked) {
    const stillLocked = user.locked_until && new Date(user.locked_until) > new Date();

    if (stillLocked) {
      await logFailedLogin({ attemptedUsername: email, ipAddress, reason: 'account locked' });
      return { success: false, locked: true, message: 'Account is locked. Please try again later.' };
    }

    // Lock window has expired — auto-unlock before continuing.
    await pool.query(
      `UPDATE users SET is_locked = FALSE, failed_attempts = 0, locked_until = NULL
       WHERE id = $1`,
      [user.id]
    );
    user.failed_attempts = 0;
  }

  // Password check
  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    const newAttempts = user.failed_attempts + 1;
    const willLock = newAttempts >= MAX_FAILED_ATTEMPTS;

    await pool.query(
      `UPDATE users
       SET failed_attempts = $1,
           is_locked = $2,
           locked_until = $3
       WHERE id = $4`,
      [
        newAttempts,
        willLock,
        willLock ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000) : null,
        user.id,
      ]
    );

    await logFailedLogin({ attemptedUsername: email, ipAddress, reason: 'wrong password' });

    if (willLock) {
      return { success: false, locked: true, message: 'Account is locked due to too many failed attempts.' };
    }
    return { success: false, message: 'Invalid email or password.' };
  }

  // Success: reset counters, update last_login 
  await pool.query(
    `UPDATE users
     SET failed_attempts = 0, is_locked = FALSE, locked_until = NULL, last_login = NOW()
     WHERE id = $1`,
    [user.id]
  );

  await logActivity({
    userId: user.id,
    actionType: 'login',
    description: 'User logged in',
    ipAddress,
  });

  return {
    success: true,
    user: { id: user.id, username: user.username, role: user.role },
  };
}

// Logging helpers
async function logActivity({ userId, actionType, description, ipAddress }) {
  await pool.query(
    `INSERT INTO activity_logs (user_id, action_type, description, ip_address)
     VALUES ($1, $2, $3, $4)`,
    [userId, actionType, description, ipAddress]
  );
}

async function logFailedLogin({ attemptedUsername, ipAddress, reason }) {
  await pool.query(
    `INSERT INTO failed_logins (attempted_username, ip_address, reason)
     VALUES ($1, $2, $3)`,
    [attemptedUsername, ipAddress, reason]
  );
}

module.exports = {
  registerUser,
  loginUser,
  logActivity,
  logFailedLogin,
};