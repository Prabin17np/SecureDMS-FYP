// src/services/userService.js
//
// API calls for user profile management and admin user management.
// All requests are axios calls with session cookies (withCredentials: true).

import api from '../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5000';

// USER PROFILE ENDPOINTS
export async function getOwnProfile() {
  const response = await api.get('/api/users/profile');
  return response.data;
}

export async function updateOwnProfile({ fullName, email }) {
  const response = await api.put('/api/users/profile', { fullName, email });
  return response.data;
}

export async function changePassword({ oldPassword, newPassword, confirmPassword }) {
  const response = await api.post('/api/users/change-password', {
    oldPassword,
    newPassword,
    confirmPassword,
  });
  return response.data;
}

export async function getOwnActivityLog(limit = 50) {
  const response = await api.get('/api/users/activity', { params: { limit } });
  return response.data;
}

// ADMIN ENDPOINTS
export async function getAllUsers() {
  const response = await api.get('/api/users');
  return response.data;
}

export async function getUserDetails(userId) {
  const response = await api.get(`/api/users/${userId}`);
  return response.data;
}

export async function getUserActivityLog(userId, limit = 100) {
  const response = await api.get(`/api/users/${userId}/activity`, { params: { limit } });
  return response.data;
}

export async function deactivateUser(userId) {
  const response = await api.delete(`/api/users/${userId}`);
  return response.data;
}
export async function reactivateUser(userId) {
  const response = await api.post(`/api/users/${userId}/reactivate`);
  return response.data;
}