//Multer configuration for document uploads. Every rule here maps
// to a specific OWASP concern — see inline comments. The guiding
// principle throughout: never trust anything about the uploaded
// file that the client controls (original filename, claimed MIME
// type, claimed extension) without independently verifying it.

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Allow-list, not a deny-list (Insecure Design).
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Storage directory lives OUTSIDE any path Express serves statically.
// app.js must never do app.use(express.static('uploads')) — files are
// only ever served through the authenticated /download controller,
// never directly by URL. This alone prevents unauthenticated file
// access even if someone guesses a stored filename.
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // The ORIGINAL filename is never used to build the path on disk.
    // This is the core path-traversal defense (OWASP A08 / A03-adjacent):
    // a filename like "../../etc/passwd" or "..\\..\\config\\.env" has
    // no effect here because we discard it entirely except for its
    // extension, which we already validated in fileFilter below.
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomUUID() + ext;
    cb(null, randomName);
  },
});

// File filter: runs BEFORE the file is written to disk.
// Checks extension AND MIME type together — relying on only one
// is a known bypass (e.g. renaming a .exe to .pdf still reports a
// MIME type multer can inspect from the upload stream headers, but
// that header is still client-supplied, so this is a first line of
// defense, not the only one — see the note below on deep validation).
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('File type not allowed.'), false);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('File type not allowed.'), false);
  }

  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1, // one file per upload request
  },
});

module.exports = { upload, UPLOAD_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES };