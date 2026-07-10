// All document DB queries and filesystem operations. The single
// most important rule enforced throughout this file: ownership is
// baked into the SQL WHERE clause itself, never checked as a
// separate "fetch then compare in JS" step. That way a future
// query added by mistake can't accidentally skip the check.

const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { UPLOAD_DIR } = require('../middleware/upload');
const { logActivity } = require('./authService');

// Create document metadata record (called after multer has already
// written the file to disk with a random UUID name)
async function createDocument({ userId, title, originalName, storedName, filePath, fileSize, mimeType, ipAddress }) {
  const result = await pool.query(
    `INSERT INTO documents (user_id, title, original_name, stored_name, file_path, file_size, mime_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, original_name, file_size, mime_type, uploaded_at`,
    [userId, title, originalName, storedName, filePath, fileSize, mimeType]
  );

  await logActivity({
    userId,
    actionType: 'upload',
    description: `Uploaded document "${title}"`,
    ipAddress,
  });

  return result.rows[0];
}

// List documents belonging to the requesting user only.
// Ownership is enforced by the WHERE clause, not by filtering
// results after the fact.
async function getUserDocuments(userId) {
  const result = await pool.query(
    `SELECT id, title, original_name, file_size, mime_type, uploaded_at
     FROM documents
     WHERE user_id = $1 AND is_deleted = FALSE
     ORDER BY uploaded_at DESC`,
    [userId]
  );
  return result.rows;
}

// Admin-only: list every document, regardless of owner.

async function getAllDocuments() {
  const result = await pool.query(
    `SELECT d.id, d.title, d.original_name, d.file_size, d.mime_type, d.uploaded_at,
            d.user_id, u.username, u.email
     FROM documents d
     JOIN users u ON u.id = d.user_id
     WHERE d.is_deleted = FALSE
     ORDER BY d.uploaded_at DESC`
  );
  return result.rows;
}

// Fetch a single document, scoped to the owner UNLESS the caller
// is an admin. 
async function getDocumentForAccess(documentId, requesterId, requesterRole) {
  const isAdmin = requesterRole === 'admin';

  const query = isAdmin
    ? `SELECT * FROM documents WHERE id = $1 AND is_deleted = FALSE`
    : `SELECT * FROM documents WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE`;

  const params = isAdmin ? [documentId] : [documentId, requesterId];

  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

// Resolve a document's stored path and verify it actually lives
// inside UPLOAD_DIR before it's ever used for a read/delete.

function resolveSafePath(storedFilePath) {
  const resolved = path.resolve(storedFilePath);
  const uploadDirResolved = path.resolve(UPLOAD_DIR);

  if (!resolved.startsWith(uploadDirResolved + path.sep)) {
    throw new Error('Resolved file path is outside the permitted upload directory.');
  }
  return resolved;
}
// Download: ownership already checked by getDocumentForAccess
// before this is called (see controller).
function getSafeFilePath(document) {
  return resolveSafePath(document.file_path);
}

// Delete: soft-delete in DB (keeps the audit trail in activity_logs
// meaningfulyou can still see "user X deleted document Y" without
// a dangling foreign key), then remove the physical file.
async function deleteDocument(documentId, requesterId, requesterRole, ipAddress) {
  const document = await getDocumentForAccess(documentId, requesterId, requesterRole);

  if (!document) {
    return { success: false, message: 'Document not found.' };
  }

  await pool.query(`UPDATE documents SET is_deleted = TRUE WHERE id = $1`, [document.id]);

  try {
    const safePath = resolveSafePath(document.file_path);
    if (fs.existsSync(safePath)) {
      fs.unlinkSync(safePath);
    }
  } catch (err) {
    // Log but don't fail the whole operation just because disk
    // cleanup failed — the DB record is already marked deleted,
    // which is the security-relevant state (document is no longer
    // accessible through the app regardless of what's on disk).
    console.error('File deletion error:', err.message);
  }

  await logActivity({
    userId: requesterId,
    actionType: 'delete',
    description: `Deleted document "${document.title}" (id: ${document.id})`,
    ipAddress,
  });

  return { success: true };
}

module.exports = {
  createDocument,
  getUserDocuments,
  getAllDocuments,
  getDocumentForAccess,
  getSafeFilePath,
  deleteDocument,
};