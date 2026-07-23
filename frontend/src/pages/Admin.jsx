// src/pages/Admin.jsx
//
// Admin document overview + system statistics
// Shows all documents from all users with admin actions

import { useEffect, useState } from 'react';
import { Shield, Users, FileText, Lock } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import DocumentCard from '../components/DocumentCard';
import PreviewModal from '../components/PreviewModal';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import { parseApiError } from '../utils/apiErrorHandler';
import { getAllDocumentsAdmin, deleteDocumentRequest } from '../services/documentService';
import { getAllUsers } from '../services/userService';

export default function Admin() {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [previewDoc, setPreviewDoc] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    lockedAccounts: 0,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Load all documents and stats on mount
  useEffect(() => {
    loadAdminData();
  }, []);

  // Filter documents when search changes
  useEffect(() => {
    const filtered = documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.original_name.toLowerCase().includes(search.toLowerCase()) ||
        doc.username.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredDocuments(filtered);
  }, [search, documents]);

  async function loadAdminData() {
    setLoading(true);
    setError('');
    try {
      // Load all documents
      const docsData = await getAllDocumentsAdmin();
      const allDocs = docsData.documents || [];
      setDocuments(allDocs);

      // Load all users
      const usersData = await getAllUsers();
      const allUsers = usersData.users || [];

      // Count locked accounts
      let lockedCount = 0;
      try {
        const lockRes = await fetch(`${API_URL}/api/security/locked-accounts`, {
          credentials: 'include',
        });
        if (lockRes.ok) {
          const lockData = await lockRes.json();
          lockedCount = lockData.lockedAccounts?.length || 0;
        }
      } catch (err) {
        console.warn('Could not load locked accounts:', err);
      }

      setStats({
        totalUsers: allUsers.length,
        totalDocuments: allDocs.length,
        lockedAccounts: lockedCount,
      });
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteDocumentRequest(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + parseApiError(err).message);
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
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-6 w-6 text-security-blue" />
          <h1 className="text-2xl font-semibold text-navy">Admin Overview</h1>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-1 md:grid-cols-4">
          <StatCard
            label="Total Users"
            value={stats.totalUsers}
            icon="👥"
            tone="default"
          />
          <StatCard
            label="Total Documents"
            value={stats.totalDocuments}
            icon="📄"
            tone="default"
          />
          <StatCard
            label="Locked Accounts"
            value={stats.lockedAccounts}
            icon={stats.lockedAccounts > 0 ? '🔒' : '✅'}
            tone={stats.lockedAccounts > 0 ? 'danger' : 'success'}
          />
          <StatCard
            label="Access Level"
            value="Administrator"
            icon="🔐"
            tone="admin"
          />
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
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, filename, or owner…"
              className="w-full rounded-lg border border-slate/30 py-2.5 pl-10 pr-3 text-sm text-navy focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20"
            />
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="rounded-lg border border-slate/10 bg-white p-12 text-center">
            <p className="text-slate">
              {documents.length === 0
                ? 'No documents in the system yet.'
                : 'No documents match your search.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                showOwner={true}
                onPreview={setPreviewDoc}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <PreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </DashboardLayout>
  );
}