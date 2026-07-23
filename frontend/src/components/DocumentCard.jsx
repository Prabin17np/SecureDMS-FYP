// src/components/DocumentCard.jsx
//
// Renders one document's metadata plus its actions (preview,
// download, edit, delete). Ownership is NOT checked here - this
// component only ever receives documents the backend already decided
// the current user is allowed to see (via GET /api/documents, which
// is scoped server-side). There is deliberately no client-side
// ownership logic to get wrong.
//
// Edit and Delete both follow the same pattern: the actual API call
// lives in the PARENT (Documents.jsx / Admin.jsx) and is passed down
// as a prop (onUpdate / onDelete). This card only renders the UI and
// calls the prop - it never imports updateDocumentRequest or
// deleteDocumentRequest directly. That keeps "who is allowed to
// trigger this" as a decision the parent page makes explicitly (by
// choosing whether to pass the prop at all), rather than something
// buried inside a shared component.

import { useState, useRef } from 'react';
import { FileText, Download, Trash2, Calendar, HardDrive, Pencil, Eye, X, Check } from 'lucide-react';
import { formatFileSize, formatDate, fileTypeLabel } from '../utils/formatters';
import { getDownloadUrl } from '../services/documentService';
import { parseApiError } from '../utils/apiErrorHandler';
import Loading from './Loading';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];

export default function DocumentCard({ document, onDelete, onUpdate, onPreview, showOwner = false }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(document.title);
  const [editFile, setEditFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const fileInputRef = useRef(null);

  async function handleConfirmedDelete() {
    setDeleting(true);
    try {
      await onDelete(document.id);
      // No need to reset state on success - the parent removes this
      // card from the list once deletion succeeds.
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  function openEdit() {
    setEditTitle(document.title);
    setEditFile(null);
    setEditError('');
    setEditing(true);
  }

  function handleFileSelect(selectedFile) {
    if (!selectedFile) return;
    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setEditError(`File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }
    setEditError('');
    setEditFile(selectedFile);
  }

  async function handleSaveEdit() {
    setEditError('');

    const titleChanged = editTitle.trim() && editTitle.trim() !== document.title;
    if (!titleChanged && !editFile) {
      setEditError('Change the title or choose a replacement file first.');
      return;
    }

    setSaving(true);
    try {
      await onUpdate({
        id: document.id,
        title: titleChanged ? editTitle.trim() : undefined,
        file: editFile || undefined,
      });
      setEditing(false);
    } catch (err) {
      setEditError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="group rounded-xl border border-slate/10 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-security-blue/10 text-security-blue">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          {!editing ? (
            <>
              <h3 className="truncate text-sm font-semibold text-navy" title={document.title}>
                {document.title}
              </h3>
              <p className="truncate text-xs text-slate" title={document.original_name}>
                {document.original_name}
              </p>
            </>
          ) : (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={255}
              className="w-full rounded-md border border-slate/30 px-2 py-1 text-sm text-navy focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20"
              placeholder="Document title"
            />
          )}
        </div>
        <span className="shrink-0 rounded-md bg-app-bg px-2 py-0.5 text-[11px] font-medium text-slate">
          {fileTypeLabel(document.mime_type)}
        </span>
      </div>

      {showOwner && document.username && (
        <p className="mt-3 text-xs text-slate">
          Owner: <span className="font-medium text-navy">{document.username}</span>
        </p>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-slate">
        <span className="flex items-center gap-1 tabular-nums">
          <HardDrive className="h-3.5 w-3.5" />
          {formatFileSize(document.file_size)}
        </span>
        <span className="flex items-center gap-1 tabular-nums">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(document.uploaded_at)}
        </span>
      </div>

      {editing && (
        <div className="mt-3 rounded-lg border border-dashed border-slate/25 p-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-medium text-security-blue hover:underline"
          >
            {editFile ? `Replacing with: ${editFile.name}` : 'Replace file (optional)'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
          {editError && <p className="mt-2 text-xs text-danger">{editError}</p>}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-slate/10 pt-4">
        {!editing ? (
          <>
            {/* Preview is offered whenever the parent supplies onPreview -
                read-only action, so pages generally pass it unconditionally,
                but keeping it prop-gated stays consistent with edit/delete. */}
            {onPreview && (
              <button
                onClick={() => onPreview(document)}
                className="flex items-center justify-center rounded-lg border border-slate/20 p-2 text-navy transition-colors hover:bg-app-bg"
                aria-label="Preview document"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            )}

            <a
              href={getDownloadUrl(document.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate/20 py-2 text-xs font-medium text-navy transition-colors hover:bg-app-bg"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>

            {/* Edit is only offered when the parent supplies onUpdate -
                same opt-in pattern as onDelete. */}
            {onUpdate && (
              <button
                onClick={openEdit}
                className="flex items-center justify-center rounded-lg border border-slate/20 p-2 text-navy transition-colors hover:bg-app-bg"
                aria-label="Edit document"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}

            {onDelete && (!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center justify-center rounded-lg border border-slate/20 p-2 text-danger transition-colors hover:bg-red-50"
                aria-label="Delete document"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleConfirmedDelete}
                  disabled={deleting}
                  className="flex items-center gap-1 rounded-lg bg-danger px-2.5 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-70"
                >
                  {deleting ? <Loading size={12} /> : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  className="rounded-lg px-2 py-2 text-xs font-medium text-slate hover:bg-app-bg"
                >
                  Cancel
                </button>
              </div>
            ))}
          </>
        ) : (
          <>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-security-blue py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-70"
            >
              {saving ? <Loading size={12} /> : <Check className="h-3.5 w-3.5" />}
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="flex items-center justify-center rounded-lg border border-slate/20 p-2 text-slate transition-colors hover:bg-app-bg"
              aria-label="Cancel edit"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
