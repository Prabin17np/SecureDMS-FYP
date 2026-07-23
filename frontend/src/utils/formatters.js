// src/utils/formatters.js
//
// Small display-only helpers. Nothing security-relevant here, but
// centralizing them keeps DocumentCard.jsx focused on rendering
// rather than formatting math.

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Maps a MIME type to a short label used for the file-type badge on
// each DocumentCard. Falls back to "FILE" for anything unrecognized
// rather than throwing.
export function fileTypeLabel(mimeType) {
  const map = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'text/plain': 'TXT',
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
  };
  return map[mimeType] || 'FILE';
}
