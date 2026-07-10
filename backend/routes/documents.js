// Every route passes through isAuthenticated first, there is no
// document endpoint reachable without a valid session. The admin
// route additionally chains isAdmin after it.

const express = require('express');
const router = express.Router();
const multer = require('multer');

const documentController = require('../controllers/documentController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Wraps multer's single-file upload so that errors it throws
// (file too large, wrong type, etc.) come back as a clean 400 JSON
// response instead of the default Express error page,which could
// otherwise leak stack traces or internal paths (OWASP A05 /
// improper error handling).
function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File exceeds the maximum allowed size.' });
      }
      return res.status(400).json({ success: false, message: 'File upload error.' });
    }
    if (err) {
      // Thrown from fileFilter (disallowed extension/MIME type)
      return res.status(400).json({ success: false, message: err.message || 'File type not allowed.' });
    }
    return next();
  });
}

// POST /api/documents/upload
router.post('/upload', isAuthenticated, handleUpload, documentController.upload);

// GET /api/documents  -> current user's own documents
router.get('/', isAuthenticated, documentController.listOwn);

// GET /api/documents/all  -> admin only, every user's documents
router.get('/all', isAuthenticated, isAdmin, documentController.listAll);

// GET /api/documents/:id/download
router.get('/:id/download', isAuthenticated, documentController.download);

// DELETE /api/documents/:id
router.delete('/:id', isAuthenticated, documentController.remove);

module.exports = router;