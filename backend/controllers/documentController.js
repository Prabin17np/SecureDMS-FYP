// HTTP layer only. No SQL, no fs path logic beyond calling the
// service — mirrors authController.js's separation of concerns.
// Every handler here assumes isAuthenticated has already run
// (see routes/documents.js), so req.session.userId is guaranteed
// to exist by the time we get here.

const fs = require('fs');
const documentService = require('../services/documentService');

// POST /api/documents/upload
// multer (middleware/upload.js) has already run by this point:
// - validated extension + MIME type
// - enforced size limit
// - written the file to disk under a random UUID name
// req.file contains the multer result; req.body.title is the
// user-supplied display name (already validated as auth's convention
// dictates - see note below on adding validation for this field).
exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded or file type not allowed.' });
    }

    const title = (req.body.title || req.file.originalname).trim();

    const document = await documentService.createDocument({
      userId: req.session.userId,
      title,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, message: 'Document uploaded successfully.', document });
  } catch (err) {
    console.error('Upload error:', err.message);
    // Clean up the file multer already wrote if the DB insert failed,
    // so we don't leave orphaned files on disk with no matching record.
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(500).json({ success: false, message: 'Upload failed. Please try again.' });
  }
};

// GET /api/documents
// Returns only the requesting user's own documents.
exports.listOwn = async (req, res) => {
  try {
    const documents = await documentService.getUserDocuments(req.session.userId);
    return res.status(200).json({ success: true, documents });
  } catch (err) {
    console.error('List documents error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not retrieve documents.' });
  }
};

// GET /api/documents/all   (admin only - route applies isAdmin)
exports.listAll = async (req, res) => {
  try {
    const documents = await documentService.getAllDocuments();
    return res.status(200).json({ success: true, documents });
  } catch (err) {
    console.error('List all documents error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not retrieve documents.' });
  }
};

// GET /api/documents/:id/download
// Ownership check happens inside getDocumentForAccess - a regular
// user gets null (and therefore 404) for a document they don't own,
// an admin can access any document.
exports.download = async (req, res) => {
  try {
    const documentId = parseInt(req.params.id, 10);
    if (Number.isNaN(documentId)) {
      return res.status(400).json({ success: false, message: 'Invalid document id.' });
    }

    const document = await documentService.getDocumentForAccess(
      documentId,
      req.session.userId,
      req.session.role
    );

    // Same 404 for "doesn't exist" and "not yours" - see documentService
    // comments for why this matters (avoids confirming other users'
    // document IDs exist).
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const safePath = documentService.getSafeFilePath(document);

    if (!fs.existsSync(safePath)) {
      // Metadata exists but the file is missing from disk - a data
      // integrity issue, not something to expose to the client in detail.
      console.error(`File missing on disk for document ${document.id}: ${safePath}`);
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // validated stored path - the client never sees or influences
    // the real path on disk.
    return res.download(safePath, document.original_name);
  } catch (err) {
    console.error('Download error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not download document.' });
  }
};

// PUT /api/documents/:id
// Title rename and/or file replacement. req.file is OPTIONAL here
// (unlike upload, where it's required) - a title-only edit sends no
// file part at all, and multer simply leaves req.file undefined in
// that case rather than erroring.
exports.update = async (req, res) => {
  try {
    const documentId = parseInt(req.params.id, 10);
    if (Number.isNaN(documentId)) {
      return res.status(400).json({ success: false, message: 'Invalid document id.' });
    }

    const result = await documentService.updateDocument(
      documentId,
      req.session.userId,
      req.session.role,
      { title: req.body.title, newFile: req.file || null },
      req.ip
    );

    if (!result.success) {
      // "No changes provided" is a client mistake (400), anything else
      // from this function means not-found-or-not-yours (404) - same
      // indistinguishable-404 principle as download/delete.
      const statusCode = result.message === 'No changes provided.' ? 400 : 404;

      // If multer already wrote a replacement file to disk but the
      // update was rejected (e.g. wrong owner), clean it up - otherwise
      // it's an orphaned file with no document ever pointing to it.
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, () => {});
      }

      return res.status(statusCode).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Document updated successfully.',
      document: result.document,
    });
  } catch (err) {
    console.error('Update error:', err.message);
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(500).json({ success: false, message: 'Could not update document.' });
  }
};

// GET /api/documents/:id/preview
// Same ownership check as download, but sets Content-Disposition:
// inline instead of attachment, so the browser renders the file
// (PDF, image, plain text) instead of forcing a save dialog. Word
// documents (.doc/.docx) will still typically download anyway, since
// browsers have no native renderer for them - inline vs attachment
// only matters for types the browser CAN render itself.
exports.preview = async (req, res) => {
  try {
    const documentId = parseInt(req.params.id, 10);
    console.log(`[PREVIEW] Request for document ID: ${documentId}, User: ${req.session.userId}`);

    if (Number.isNaN(documentId)) {
      return res.status(400).json({ success: false, message: 'Invalid document id.' });
    }

    const document = await documentService.getDocumentForAccess(
      documentId,
      req.session.userId,
      req.session.role
    );

    console.log(`[PREVIEW] Document lookup result:`, document);

    if (!document) {
      console.log(`[PREVIEW] Document not found or access denied`);
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const safePath = documentService.getSafeFilePath(document);
    console.log(`[PREVIEW] Safe path:`, safePath);
    console.log(`[PREVIEW] File exists:`, fs.existsSync(safePath));

    if (!fs.existsSync(safePath)) {
      console.error(`[PREVIEW] File missing on disk for document ${document.id}: ${safePath}`);
      return res.status(404).json({ success: false, message: 'File not found on disk.' });
    }

    // Set headers
    res.setHeader('Content-Type', document.mime_type);
    const encodedName = encodeURIComponent(document.original_name);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodedName}`);

    console.log(`[PREVIEW] Sending file:`, document.original_name, `(${document.mime_type})`);
    return res.sendFile(safePath);
  } catch (err) {
    console.error('[PREVIEW] Error:', err.message, err.stack);
    return res.status(500).json({ success: false, message: 'Could not preview document.', error: err.message });
  }
};

// DELETE /api/documents/:id

exports.remove = async (req, res) => {
  try {
    const documentId = parseInt(req.params.id, 10);
    if (Number.isNaN(documentId)) {
      return res.status(400).json({ success: false, message: 'Invalid document id.' });
    }

    const result = await documentService.deleteDocument(
      documentId,
      req.session.userId,
      req.session.role,
      req.ip
    );

    if (!result.success) {
      return res.status(404).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: 'Document deleted successfully.' });
  } catch (err) {
    console.error('Delete error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not delete document.' });
  }
};
// ADD THIS TO backend/controllers/documentController.js

// GET /api/documents/stats/storage - get user's storage usage
exports.getStorageStats = async (req, res) => {
  try {
    const userId = req.session.userId;
    const pool = require('../config/db');

    // Get total file size for this user's documents (excluding deleted)
    const result = await pool.query(
      `SELECT COALESCE(SUM(file_size), 0) as total_used
       FROM documents
       WHERE user_id = $1 AND is_deleted = FALSE`,
      [userId]
    );

    const totalUsed = parseInt(result.rows[0].total_used, 10);
    const limit = 100 * 1024 * 1024; // 100 MB default limit

    return res.status(200).json({
      success: true,
      storage: {
        used: totalUsed,
        limit: limit,
        percentUsed: Math.round((totalUsed / limit) * 100),
      },
    });
  } catch (err) {
    console.error('Get storage stats error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not retrieve storage stats.' });
  }
};