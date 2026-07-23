// src/pages/SecurityLogs.jsx
//
// Admin-only page showing failed login attempts and locked accounts
// Allows admin to unlock accounts

import { useEffect, useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Loading from '../components/Loading';
import { parseApiError } from '../utils/apiErrorHandler';
import { formatDate } from '../utils/formatters';

export default function SecurityLogs() {
  const [failedLogins, setFailedLogins] = useState([]);
  const [lockedAccounts, setLockedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadSecurityData();
  }, []);

  async function loadSecurityData() {
    setLoading(true);
    setError('');
    try {
      // Get failed logins
      const failedLoginRes = await fetch(`${API_URL}/api/security/failed-logins`, {
        credentials: 'include',
      });
      if (failedLoginRes.ok) {
        const data = await failedLoginRes.json();
        setFailedLogins(data.failedLogins || []);
      }

      // Get locked accounts
      const lockedRes = await fetch(`${API_URL}/api/security/locked-accounts`, {
        credentials: 'include',
      });
      if (lockedRes.ok) {
        const data = await lockedRes.json();
        setLockedAccounts(data.lockedAccounts || []);
      }
    } catch (err) {
      setError('Failed to load security logs');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlockAccount(userId) {
    if (!window.confirm('Unlock this account?')) return;

    setUnlocking(true);
    try {
      const res = await fetch(`${API_URL}/api/security/unlock/${userId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        setLockedAccounts((prev) => prev.filter((acc) => acc.id !== userId));
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to unlock account');
      }
    } catch (err) {
      alert('Error unlocking account');
    } finally {
      setUnlocking(false);
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
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-6 w-6 text-security-blue" />
          <h1 className="text-2xl font-semibold text-navy">Security Logs</h1>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-danger/20 bg-red-50 p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Locked Accounts Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-navy mb-4">Locked Accounts</h2>
          {lockedAccounts.length === 0 ? (
            <div className="rounded-lg border border-slate/10 bg-white p-6 text-center">
              <p className="text-sm text-slate">No locked accounts</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate/10 bg-white shadow-card">
              <table className="w-full text-sm">
                <thead className="border-b border-slate/10 bg-slate-light">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-navy">Username</th>
                    <th className="px-4 py-3 text-left font-semibold text-navy">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-navy">Locked Until</th>
                    <th className="px-4 py-3 text-center font-semibold text-navy">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lockedAccounts.map((account) => (
                    <tr key={account.id} className="border-b border-slate/10 hover:bg-slate-light">
                      <td className="px-4 py-3 font-mono text-navy">{account.username}</td>
                      <td className="px-4 py-3 text-slate">{account.email}</td>
                      <td className="px-4 py-3 text-slate">
                        {account.locked_until ? formatDate(account.locked_until) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleUnlockAccount(account.id)}
                          disabled={unlocking}
                          className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-70"
                        >
                          {unlocking ? 'Unlocking...' : 'Unlock'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Failed Login Attempts Section */}
        <div>
          <h2 className="text-lg font-semibold text-navy mb-4">Recent Failed Logins</h2>
          {failedLogins.length === 0 ? (
            <div className="rounded-lg border border-slate/10 bg-white p-6 text-center">
              <p className="text-sm text-slate">No failed login attempts</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate/10 bg-white shadow-card">
              <table className="w-full text-sm">
                <thead className="border-b border-slate/10 bg-slate-light">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-navy">Email/Username</th>
                    <th className="px-4 py-3 text-left font-semibold text-navy">IP Address</th>
                    <th className="px-4 py-3 text-left font-semibold text-navy">Reason</th>
                    <th className="px-4 py-3 text-left font-semibold text-navy">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {failedLogins.slice(0, 50).map((login, idx) => (
                    <tr key={idx} className="border-b border-slate/10 hover:bg-slate-light">
                      <td className="px-4 py-3 font-mono text-navy text-xs">
                        {login.attempted_username}
                      </td>
                      <td className="px-4 py-3 text-slate text-xs">{login.ip_address || 'Unknown'}</td>
                      <td className="px-4 py-3 text-slate text-xs">{login.reason || 'Unknown'}</td>
                      <td className="px-4 py-3 text-slate text-xs">
                        {formatDate(login.attempted_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}