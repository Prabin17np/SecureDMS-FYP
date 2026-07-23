// src/api/axios.js

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// AuthContext registers itself here on mount so the interceptor can
// clear client-side auth state without importing React context logic
// into a plain axios config file (keeps this file framework-agnostic).
let onUnauthorized = null;
export function registerUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    // Don't treat a failed LOGIN attempt itself as "session expired" -
    // that 401 just means wrong credentials, which the Login page
    // already handles and displays inline.
    const isLoginRequest = requestUrl.includes('/api/auth/login');

    if (status === 401 && !isLoginRequest && onUnauthorized) {
      onUnauthorized();
    }

    return Promise.reject(error);
  }
);

export default api;
