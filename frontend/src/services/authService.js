// src/services/authService.js
//
// Thin wrapper around the auth endpoints. Nothing in here decides
// UI behavior (redirects, error display) — it just makes the calls
// and lets errors propagate, so AuthContext and the pages decide
// what to do with a failure. Keeping this dumb makes it easy to
// reuse from anywhere without dragging in routing/UI assumptions.

import api from '../api/axios';

export async function registerRequest({ username, email, full_name, password }) {
  const response = await api.post('/api/auth/register', {
    username,
    email,
    full_name,
    password,
  });
  return response.data;
}

export async function loginRequest({ email, password }) {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
}

export async function logoutRequest() {
  const response = await api.post('/api/auth/logout');
  return response.data;
}

export async function getCurrentUserRequest() {
  const response = await api.get('/api/auth/me');
  return response.data;
}
