// backend/routes/documents.js
// Document routes. All routes require isAuthenticated first.
// /all endpoint additionally requires isAdmin.

const express = require('express');
const router = express.Router();
const multer = require('multer');

const documentController = require('../controllers/documentController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Wraps multer's single-file upload error handling
function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File exceeds the maximum allowed size.' });
      }
      return res.status(400).json({ success: false, message: 'File upload error.' });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File type not allowed.' });
    }
    return next();
  });
}

// GET /api/documents/stats/storage - get user's storage usage
router.get('/stats/storage', isAuthenticated, documentController.getStorageStats);

// POST /api/documents/upload - upload a new document
router.post('/upload', isAuthenticated, handleUpload, documentController.upload);

// GET /api/documents - get current user's documents
router.get('/', isAuthenticated, documentController.listOwn);

// GET /api/documents/all - admin only, all documents
router.get('/all', isAuthenticated, isAdmin, documentController.listAll);

// GET /api/documents/:id/download - download a document
router.get('/:id/download', isAuthenticated, documentController.download);

// GET /api/documents/:id/preview - preview a document
router.get('/:id/preview', isAuthenticated, documentController.preview);

// PUT /api/documents/:id - update document (rename or replace file)
router.put('/:id', isAuthenticated, handleUpload, documentController.update);

// DELETE /api/documents/:id - delete a document
router.delete('/:id', isAuthenticated, documentController.remove);

module.exports = router;