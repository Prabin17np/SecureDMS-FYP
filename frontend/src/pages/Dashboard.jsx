// src/pages/Dashboard.jsx
//
// User dashboard showing personal statistics, storage usage, and recent activity

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import StorageUsage from '../components/StorageUsage';
import RecentActivityWidget from '../components/RecentActivityWidget';
import Loading from '../components/Loading';
import { parseApiError } from '../utils/apiErrorHandler';
import { getDocuments, getStorageStats } from '../services/documentService';
import { getOwnActivityLog } from '../services/userService';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    recentUploads: 0,
  });
  const [storage, setStorage] = useState({ used: 0, limit: 100 * 1024 * 1024 });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError('');
      try {
        // Load documents
        const docsData = await getDocuments();
        const docs = docsData.documents || [];
        
        // Count recent uploads (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentCount = docs.filter(
          (doc) => new Date(doc.uploaded_at) > sevenDaysAgo
        ).length;

        setStats({
          totalDocuments: docs.length,
          recentUploads: recentCount,
        });

        // Load storage stats
        try {
          const storageData = await getStorageStats();
          setStorage({
            used: storageData.storage.used || 0,
            limit: storageData.storage.limit || 100 * 1024 * 1024,
          });
        } catch (err) {
          console.warn('Could not load storage stats:', err);
          // Fall back to calculate from documents
          const totalSize = docs.reduce((sum, doc) => sum + parseInt(doc.file_size, 10), 0);
          setStorage({ used: totalSize, limit: 100 * 1024 * 1024 });
        }

        // Load activity log
        try {
          const activityData = await getOwnActivityLog(10);
          setActivities(activityData.activityLog || []);
        } catch (err) {
          console.warn('Could not load activities:', err);
        }
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

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
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-6 w-6 text-security-blue" />
          <h1 className="text-2xl font-semibold text-navy">Dashboard</h1>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-danger/20 bg-red-50 p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-1 md:grid-cols-3">
          <StatCard
            label="Total Documents"
            value={stats.totalDocuments}
            icon="📄"
            tone="default"
          />
          <StatCard
            label="Uploaded (7 days)"
            value={stats.recentUploads}
            icon="📤"
            tone="success"
          />
          <StatCard
            label="Account Status"
            value="Active"
            icon="✅"
            tone="success"
          />
        </div>

        {/* Storage Usage and Recent Activity */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {/* Storage Usage Widget */}
          <StorageUsage usedBytes={storage.used} limitBytes={storage.limit} />

          {/* Recent Activity Widget */}
          <RecentActivityWidget activities={activities} loading={false} />
        </div>
      </div>
    </DashboardLayout>
  );
}