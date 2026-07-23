// src/components/PreviewModal.jsx
//
// Renders the /preview endpoint's response inline. What actually
// renders depends on mime_type:
// - PDF: <iframe> pointed at the preview URL - browsers have a
//   built-in PDF viewer that will render it directly.
// - Images (jpg/png): plain <img>.
// - Everything else (doc/docx, and anything the browser can't render
//   natively): an honest "no inline preview available" message with
//   a download link, rather than showing a broken iframe.
//
// The preview URL itself carries the session cookie the same way
// download does (same-site GET navigation/embed, not an XHR call),
// and the backend re-checks ownership on every request - this modal
// does not cache or assume access, it just points the browser at the
// endpoint and lets the backend decide.

import { X, Download, FileWarning } from 'lucide-react';
import { getPreviewUrl, getDownloadUrl } from '../services/documentService';

const PREVIEWABLE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export default function PreviewModal({ document, onClose }) {
  if (!document) return null;

  const canPreview = PREVIEWABLE_TYPES.includes(document.mime_type);
  const isImage = document.mime_type.startsWith('image/');

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fadeIn bg-navy/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative flex h-[85vh] w-full max-w-3xl animate-fadeIn flex-col rounded-2xl bg-white shadow-card-hover">
        <div className="flex items-center justify-between border-b border-slate/10 px-5 py-3">
          <h3 className="truncate text-sm font-semibold text-navy" title={document.title}>
            {document.title}
          </h3>
          <button onClick={onClose} className="text-slate hover:text-navy" aria-label="Close preview">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-app-bg">
          {!canPreview ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <FileWarning className="h-10 w-10 text-slate/50" />
              <p className="text-sm font-medium text-navy">
                No inline preview available for this file type.
              </p>
              <p className="text-xs text-slate">
                {document.original_name} - download it to view the full contents.
              </p>
              <a
                href={getDownloadUrl(document.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-security-blue px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Download className="h-3.5 w-3.5" />
                Download instead
              </a>
            </div>
          ) : isImage ? (
            <div className="flex h-full items-center justify-center p-4">
              <img
                src={getPreviewUrl(document.id)}
                alt={document.title}
                className="max-h-full max-w-full rounded-lg object-contain shadow-card"
              />
            </div>
          ) : (
            <iframe
              src={getPreviewUrl(document.id)}
              title={document.title}
              className="h-full w-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}
