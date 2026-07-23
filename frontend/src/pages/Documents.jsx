// src/pages/Documents.jsx
//
// User's document management page with upload, preview, edit, delete, search, sort, filter

import { useEffect, useState } from 'react';
import { Upload, Search } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import DocumentCard from '../components/DocumentCard';
import PreviewModal from '../components/PreviewModal';
import UploadModal from '../components/UploadModal';
import Loading from '../components/Loading';
import { parseApiError } from '../utils/apiErrorHandler';
import {
  getDocuments,
  deleteDocumentRequest,
  updateDocumentRequest,
} from '../services/documentService';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterType, setFilterType] = useState('all');

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Filter and sort documents when search, sort, or filter changes
  useEffect(() => {
    let filtered = documents.filter((doc) => {
      // Search filter
      const matchesSearch =
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.original_name.toLowerCase().includes(search.toLowerCase());

      // File type filter
      let matchesType = true;
      if (filterType !== 'all') {
        const ext = doc.original_name.split('.').pop().toLowerCase();
        if (filterType === 'pdf') matchesType = ext === 'pdf';
        if (filterType === 'docs') matchesType = ['doc', 'docx', 'txt'].includes(ext);
        if (filterType === 'images') matchesType = ['jpg', 'jpeg', 'png'].includes(ext);
      }

      return matchesSearch && matchesType;
    });

    // Sort
    let sorted = [...filtered];
    switch (sortBy) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.uploaded_at) - new Date(b.uploaded_at));
        break;
      case 'size-desc':
        sorted.sort((a, b) => b.file_size - a.file_size);
        break;
      case 'size-asc':
        sorted.sort((a, b) => a.file_size - b.file_size);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
        break;
    }

    setFilteredDocuments(sorted);
  }, [search, documents, sortBy, filterType]);

  async function loadDocuments() {
    setLoading(true);
    setError('');
    try {
      const data = await getDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadSuccess() {
    setUploadModalOpen(false);
    await loadDocuments();
  }

  async function handleDelete(id) {
    try {
      await deleteDocumentRequest(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + parseApiError(err).message);
    }
  }

  async function handleUpdate({ id, title, file }) {
    try {
      const result = await updateDocumentRequest({ id, title, file });
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, ...result.document } : doc))
      );
    } catch (err) {
      throw parseApiError(err);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center">
          <Loading />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-navy">My Documents</h1>
            <p className="text-slate text-sm mt-1">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-security-blue px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            Upload document
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-danger/20 bg-red-50 p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6 max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or filename..."
              className="w-full rounded-lg border border-slate/30 py-2.5 pl-10 pr-3 text-sm text-navy focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20"
            />
          </div>
        </div>

        {/* Sort and Filter Controls */}
        <div className="mb-6 flex flex-wrap gap-3">
          {/* Sort Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate/30 px-3 py-2 text-sm text-navy focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
              <option value="name-asc">A to Z</option>
              <option value="name-desc">Z to A</option>
            </select>
          </div>

          {/* Filter Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate mb-1">Filter By Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-slate/30 px-3 py-2 text-sm text-navy focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20"
            >
              <option value="all">All Files</option>
              <option value="pdf">PDF</option>
              <option value="docs">Documents</option>
              <option value="images">Images</option>
            </select>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="rounded-lg border border-slate/10 bg-white p-12 text-center">
            <p className="text-slate">
              {documents.length === 0
                ? 'No documents yet. Upload one to get started.'
                : 'No documents match your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onPreview={setPreviewDoc}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <UploadModal
          onClose={() => setUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <PreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </DashboardLayout>
  );
}