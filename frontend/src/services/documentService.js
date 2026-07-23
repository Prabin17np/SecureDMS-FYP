// src/services/documentService.js
//
// Frontend API calls for document operations.
// All requests use session cookies (withCredentials: true).

import api from '../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5000';

// GET /api/documents - get current user's documents
export async function getDocuments() {
  const response = await api.get('/api/documents');
  return response.data;
}

// GET /api/documents/all - admin only: get all documents
export async function getAllDocumentsAdmin() {
  const response = await api.get('/api/documents/all');
  return response.data;
}

// POST /api/documents/upload - upload a new document
export async function uploadDocument(file, title, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);

  const response = await api.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
}

// GET /api/documents/:id/download - get download URL for a document
export function getDownloadUrl(documentId) {
  return `${API_BASE_URL}/api/documents/${documentId}/download`;
}

// GET /api/documents/:id/preview - get preview URL for a document
export function getPreviewUrl(documentId) {
  return `${API_BASE_URL}/api/documents/${documentId}/preview`;
}

// PUT /api/documents/:id - update document (rename title and/or replace file)
export async function updateDocumentRequest({ id, title, file, onProgress }) {
  const formData = new FormData();
  
  if (title) {
    formData.append('title', title);
  }
  
  if (file) {
    formData.append('file', file);
  }

  const response = await api.put(`/api/documents/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
}

// DELETE /api/documents/:id - delete a document
export async function deleteDocumentRequest(documentId) {
  const response = await api.delete(`/api/documents/${documentId}`);
  return response.data;
}

// GET /api/documents/stats/storage - get user's storage usage
export async function getStorageStats() {
  const response = await api.get('/api/documents/stats/storage');
  return response.data;
}