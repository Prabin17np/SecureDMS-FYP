// src/context/AuthContext.jsx
//
// Provides { user, isAuthenticated, isAdmin, loading, login, logout }
// to the whole app via useAuth().
//
// Session truth model:
// - sessionStorage holds a cached { id, username, role } purely so
//   the UI can paint "Welcome, Alice" instantly on refresh instead of
//   flashing a blank/logged-out state while a network request is in
//   flight. It is a paint hint, nothing more.
// - On mount, we call GET /api/auth/me to ask the backend "is this
//   session actually still valid, and who does it belong to right
//   now". That response is what actually sets `user` and `loading`.
//   If the cached value and the real answer disagree (session
//   expired, account locked, role changed), the real answer wins.
// - The axios 401 interceptor (api/axios.js) also calls logout()
//   the moment ANY request comes back unauthorized, so a session
//   that dies mid-use is caught immediately, not just on page load.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginRequest, logoutRequest, getCurrentUserRequest } from '../services/authService';
import { registerUnauthorizedHandler } from '../api/axios';

export const AuthContext = createContext(null);

const STORAGE_KEY = 'sdms_user';

function readCachedUser() {
  try {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedUser);
  // Starts true: until GET /api/auth/me returns, we don't actually
  // know if the cached user above is still valid. ProtectedRoute
  // waits for this before deciding to redirect to /login.
  const [loading, setLoading] = useState(true);

  const login = useCallback(async ({ email, password }) => {
    const data = await loginRequest({ email, password });
    setUser(data.user);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
    return data;
  }, []);

  const logout = useCallback(async (skipServerCall = false) => {
    if (!skipServerCall) {
      try {
        await logoutRequest();
      } catch {
        // Clear client state regardless of whether the server call
        // succeeded - there's no case where keeping stale "logged in"
        // UI around is the safer choice.
      }
    }
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  // Verify the real session state once on mount.
  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        const data = await getCurrentUserRequest();
        if (!cancelled) {
          setUser(data.user);
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        }
      } catch {
        // 401 (or any failure) means there's no valid session -
        // clear both state and cache rather than trust the cache.
        if (!cancelled) {
          setUser(null);
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    verifySession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Any 401 from any API call anywhere in the app triggers a silent
  // client-side logout (no need to call the server again - if it's
  // returning 401, it already considers the session gone).
  useEffect(() => {
    registerUnauthorizedHandler(() => logout(true));
  }, [logout]);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
