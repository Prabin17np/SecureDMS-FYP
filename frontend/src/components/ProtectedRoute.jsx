// src/components/ProtectedRoute.jsx
//
// Route guard. Two things to be precise about here, both stated
// directly in your brief:
//
// 1. This is UI convenience only. It stops an unauthenticated
//    browser tab from RENDERING a page - it does nothing to stop
//    someone from calling the API directly (curl, Postman, a
//    modified frontend). The actual authority is the backend's
//    isAuthenticated/isAdmin middleware, which runs on every request
//    regardless of what this component does. If someone bypasses
//    this component entirely, every API call still gets checked
//    server-side and still returns 401/403 correctly.
//
// 2. It waits for AuthContext's initial GET /api/auth/me check to
//    finish (loading === true) before deciding to redirect. Without
//    this, a logged-in user refreshing the page would get bounced
//    to /login for a split second before the session check resolves,
//    which is both a bad UX and could look like a legitimate user
//    "getting logged out" when they weren't.

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loading from './Loading';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <Loading size={28} className="text-security-blue" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Remember where they were headed so Login can send them back
    // after a successful sign-in, instead of always to /dashboard.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // Authenticated, but not an admin - 403-equivalent in UI terms.
    // Send them somewhere they DO have access to, not back to /login
    // (they're not unauthenticated, so /login would be misleading).
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
