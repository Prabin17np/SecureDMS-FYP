// src/components/UploadModal.jsx
//
// Modal for uploading documents. Shows:
// - File input (drag-drop or click)
// - Title input
// - Progress bar during upload
// - Success/error messages

import { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { parseApiError } from '../utils/apiErrorHandler';
import { uploadDocument } from '../services/documentService';

export default function UploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const maxFileSize = 10 * 1024 * 1024; // 10 MB
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }

  function handleFileSelect(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }

  function validateAndSetFile(selectedFile) {
    setError('');

    // Check file size
    if (selectedFile.size > maxFileSize) {
      setError(`File exceeds 10 MB limit. Your file is ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB.`);
      return;
    }

    // Check file type
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExt = allowedTypes.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      setError(`File type not allowed. Accepted types: ${allowedTypes.join(', ')}`);
      return;
    }

    setFile(selectedFile);
    // Auto-populate title from filename (without extension)
    const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
    setTitle(nameWithoutExt);
  }

  async function handleUpload(e) {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a document title.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      await uploadDocument(file, title.trim(), (progressPercent) => {
        setProgress(progressPercent);
      });

      setSuccess(true);
      setProgress(100);

      // Close modal after 1.5 seconds
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(parseApiError(err).message);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={!uploading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate/10 bg-slate-light px-6 py-4">
            <h2 className="font-semibold text-navy">Upload Document</h2>
            {!uploading && (
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate hover:bg-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {success ? (
              /* Success State */
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="font-semibold text-navy mb-2">Upload Successful!</h3>
                <p className="text-sm text-slate mb-4">Your document has been uploaded.</p>
                <p className="text-xs text-slate/60">{file?.name}</p>
              </div>
            ) : uploading ? (
              /* Uploading State */
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-navy">Uploading...</p>
                    <span className="text-sm font-semibold text-security-blue">{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-security-blue transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate text-center">{file?.name}</p>
              </div>
            ) : (
              /* Default State */
              <form onSubmit={handleUpload} className="space-y-4">
                {/* File Input - Drag & Drop */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="rounded-lg border-2 border-dashed border-slate/30 bg-slate-light p-8 text-center transition-colors hover:border-security-blue hover:bg-blue-50 cursor-pointer"
                >
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="cursor-pointer block">
                    <Upload className="h-8 w-8 text-slate/60 mx-auto mb-2" />
                    <p className="text-sm font-medium text-navy mb-1">
                      {file ? file.name : 'Drop file or click to browse'}
                    </p>
                    <p className="text-xs text-slate/60">
                      PDF, DOC, DOCX, TXT, JPG, JPEG, PNG up to 10 MB
                    </p>
                  </label>
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-xs font-medium text-slate mb-2">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Project Report"
                    disabled={uploading}
                    className="w-full rounded-lg border border-slate/30 px-3 py-2.5 text-sm text-navy placeholder-slate/40 focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20 disabled:bg-slate-light"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-lg border border-danger/20 bg-red-50 p-3 flex gap-2">
                    <AlertCircle className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-danger">{error}</p>
                  </div>
                )}

                {/* File Info */}
                {file && (
                  <div className="rounded-lg bg-slate-light p-3">
                    <p className="text-xs text-slate">
                      <span className="font-medium">Size:</span> {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={uploading}
                    className="flex-1 rounded-lg border border-slate/20 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-slate-light disabled:opacity-70"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!file || !title.trim() || uploading}
                    className="flex-1 rounded-lg bg-security-blue py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-70"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}