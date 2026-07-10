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