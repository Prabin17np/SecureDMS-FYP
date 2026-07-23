// src/components/UploadForm.jsx
//
// IMPORTANT: the extension check in this component is a UX nicety
// only - it lets us tell the user "that file type isn't allowed"
// instantly instead of waiting on a round trip. It is NOT a security
// control and must never be treated as one: a user can trivially
// bypass any client-side check (browser devtools, editing the request,
// or just not using this form at all). The real enforcement is
// entirely server-side, in middleware/upload.js's fileFilter, which
// checks extension AND MIME type on the actual bytes received - this
// form's check exists purely so a legitimate user doesn't wait for a
// network round trip just to learn they picked the wrong file type.

import { useState, useRef } from 'react';
import { UploadCloud, X, CheckCircle2 } from 'lucide-react';
import { uploadDocument } from '../services/documentService';
import { parseApiError } from '../utils/apiErrorHandler';
import Loading from './Loading';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // matches backend limit - see middleware/upload.js

export default function UploadForm({ onUploaded, onCancel }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function handleFileSelect(selectedFile) {
    setError('');
    if (!selectedFile) return;

    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }
    if (selectedFile.size > MAX_SIZE_BYTES) {
      setError('File exceeds the 10 MB size limit.');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      // Pre-fill title from the filename (minus extension) as a
      // convenience - the user can still edit it before submitting.
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setError('');
    setUploading(true);
    setProgress(0);

    try {
      await uploadDocument({ file, title: title.trim() || file.name, onProgress: setProgress });
      setSuccess(true);
      setTimeout(() => onUploaded?.(), 900);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
      setUploading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-slate/10 bg-white p-8 text-center shadow-card">
        <CheckCircle2 className="h-10 w-10 animate-checkPop text-success" strokeWidth={1.75} />
        <p className="mt-3 text-sm font-medium text-navy">Document uploaded successfully.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate/10 bg-white p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy">Upload a document</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate hover:text-navy"
          aria-label="Close upload form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-danger/30 bg-red-50 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileSelect(e.dataTransfer.files?.[0]);
        }}
        className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate/25 px-4 py-8 text-center transition-colors hover:border-security-blue/50 hover:bg-security-blue/5"
      >
        <UploadCloud className="h-8 w-8 text-slate" />
        <p className="mt-2 text-sm text-navy">
          {file ? file.name : 'Click to browse or drag a file here'}
        </p>
        <p className="mt-1 text-xs text-slate">PDF, DOC, DOCX, TXT, JPG, PNG — up to 10 MB</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
      </div>

      <div className="mt-4">
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-navy">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={255}
          className="w-full rounded-lg border border-slate/30 px-3 py-2.5 text-sm text-navy transition-colors focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20"
          placeholder="e.g. Q3 Financial Report"
        />
      </div>

      {uploading && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-app-bg">
            <div
              className="h-full rounded-full bg-security-blue transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs tabular-nums text-slate">{progress}%</p>
        </div>
      )}

      <button
        type="submit"
        disabled={uploading || !file}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-security-blue py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading && <Loading size={16} />}
        {uploading ? 'Uploading…' : 'Upload document'}
      </button>
    </form>
  );
}
