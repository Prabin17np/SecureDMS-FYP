// src/pages/Users.jsx
//
// Admin-only page for user account management. View all users, inspect
// individual user details and activity logs, and deactivate/reactivate accounts.
// RBAC is enforced by ProtectedRoute (requireAdmin) before this component
// ever renders, and isAdmin middleware on each backend endpoint.

import { useEffect, useState } from 'react';
import { Users as UsersIcon, Search, Eye, MoreVertical } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import ActivityLog from '../components/ActivityLog';
import Loading from '../components/Loading';
import { parseApiError } from '../utils/apiErrorHandler';
import {
  getAllUsers,
  getUserDetails,
  getUserActivityLog,
  deactivateUser,
  reactivateUser,
} from '../services/userService';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  // Load all users on mount
  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setError('');
      try {
        const data = await getAllUsers();
        setUsers(data.users || []);
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  // View a user's details and activity
  async function handleViewDetails(user) {
    setViewingDetails(true);
    setSelectedUser(user);
    setDetailsLoading(true);
    setDetailsError('');
    try {
      const [details, activity] = await Promise.all([
        getUserDetails(user.id),
        getUserActivityLog(user.id, 100),
      ]);
      setUserDetails(details.user);
      setUserActivity(activity.activityLog || []);
    } catch (err) {
      setDetailsError(parseApiError(err).message);
    } finally {
      setDetailsLoading(false);
    }
  }

  // Deactivate a user account
  async function handleDeactivate(userId) {
    if (!window.confirm('Are you sure you want to deactivate this account?')) return;

    setDeactivating(true);
    try {
      await deactivateUser(userId);
      setUserDetails(prev => ({ ...prev, is_active: false }));
    } catch (err) {
      setDetailsError(parseApiError(err).message);
    } finally {
      setDeactivating(false);
    }
  }

  // Reactivate a user account
  async function handleReactivate(userId) {
    if (!window.confirm('Are you sure you want to reactivate this account?')) return;

    setDeactivating(true);
    try {
      await reactivateUser(userId);
      setUserDetails(prev => ({ ...prev, is_active: true }));
    } catch (err) {
      setDetailsError(parseApiError(err).message);
    } finally {
      setDeactivating(false);
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(search.toLowerCase()))
  );

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
      <div className="flex items-center gap-2">
        <UsersIcon className="h-6 w-6 text-security-blue" />
        <h1 className="text-2xl font-semibold text-navy">User Management</h1>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-danger/20 bg-red-50 p-4">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="mt-6 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or username…"
            className="w-full rounded-lg border border-slate/30 py-2.5 pl-10 pr-3 text-sm text-navy focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20"
          />
        </div>
      </div>

      {/* Users Table */}
      {!viewingDetails ? (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate/10 bg-white shadow-card">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate">No users found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate/10 bg-app-bg">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-navy">Username</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy">Full Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-navy">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-navy">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate/10 hover:bg-app-bg/50">
                    <td className="px-4 py-3 font-mono text-navy">{user.username}</td>
                    <td className="px-4 py-3 text-slate">{user.email}</td>
                    <td className="px-4 py-3 text-navy">{user.full_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-security-blue/10 text-security-blue'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium ${
                          user.is_active
                            ? 'bg-success/10 text-success'
                            : 'bg-danger/10 text-danger'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate/20 px-3 py-1.5 text-xs font-medium text-navy transition-colors hover:bg-app-bg"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* User Details View */
        <div className="mt-6 space-y-6">
          <div className="rounded-lg border border-slate/10 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-navy">{userDetails?.username}</h2>
                <p className="mt-1 text-sm text-slate">{userDetails?.email}</p>
              </div>
              <button
                onClick={() => setViewingDetails(false)}
                className="rounded-lg bg-slate px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate/90"
              >
                Back to List
              </button>
            </div>

            {detailsLoading ? (
              <div className="mt-4">
                <Loading />
              </div>
            ) : detailsError ? (
              <div className="mt-4 rounded-lg border border-danger/20 bg-red-50 p-4">
                <p className="text-sm text-danger">{detailsError}</p>
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-slate">Full Name</p>
                    <p className="mt-1 text-sm text-navy">{userDetails?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate">Role</p>
                    <p className="mt-1 text-sm capitalize text-navy">{userDetails?.role}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate">Status</p>
                    <p className="mt-1 text-sm text-navy">
                      {userDetails?.is_active ? 'Active' : 'Deactivated'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate">Last Login</p>
                    <p className="mt-1 text-sm text-navy">
                      {userDetails?.last_login ? new Date(userDetails.last_login).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>

                {userDetails?.is_active ? (
                  <button
                    onClick={() => handleDeactivate(userDetails.id)}
                    disabled={deactivating}
                    className="mt-6 rounded-lg bg-danger px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-70"
                  >
                    {deactivating ? 'Deactivating...' : 'Deactivate Account'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivate(userDetails.id)}
                    disabled={deactivating}
                    className="mt-6 rounded-lg bg-success px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-70"
                  >
                    {deactivating ? 'Reactivating...' : 'Reactivate Account'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* User Activity Log */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-navy">Activity Log</h3>
            <ActivityLog
              activityLog={userActivity}
              loading={detailsLoading}
              error={detailsError}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}