// Central access-control gate (OWASP A01: Broken Access Control).
// Any route that needs "must be logged in" imports isAuthenticated.
// Deliberately does NOT trust anything from the request body or
// query string for identity — only req.session, which is server-side
// state the client cannot forge (as long as SESSION_SECRET is kept
// secret and cookies are httpOnly, both already configured).

function isAuthenticated(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.',
    });
  }
  return next();
}

// Not required by this task yet, but included now so future admin
// without touching this file again.
function isAdmin(req, res, next) {
  if (!req.session || req.session.role !== 'admin') {
    // 403, not 401: the user IS authenticated, they just lack permission.
    // Distinguishing 401 vs 403 correctly is itself something white-box
    // testing checks for.
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required.',
    });
  }
  return next();
}

module.exports = { isAuthenticated, isAdmin };