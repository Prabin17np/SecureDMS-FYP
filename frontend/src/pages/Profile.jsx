// src/pages/Profile.jsx
//
// Authenticated user views and edits their own profile (name, email),
// changes their password, and views their complete activity log.
// All data is owned by the current user (req.session.userId on backend).

import { useEffect, useState } from 'react';
import { User, Lock, History } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/DashboardLayout';
import ActivityLog from '../components/ActivityLog';
import Loading from '../components/Loading';
import { parseApiError } from '../utils/apiErrorHandler';
import {
  getOwnProfile,
  updateOwnProfile,
  changePassword,
  getOwnActivityLog,
} from '../services/userService';

export default function Profile() {
  const { logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '' });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');

  // Load profile and activity log on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const profileData = await getOwnProfile();
        setProfile(profileData.user);
        setEditForm({
          fullName: profileData.user.full_name,
          email: profileData.user.email,
        });

        const logData = await getOwnActivityLog(50);
        setActivityLog(logData.activityLog || []);
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleSaveProfile() {
    setEditError('');
    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      setEditError('Full name and email are required.');
      return;
    }

    setEditSaving(true);
    try {
      const result = await updateOwnProfile({
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
      });
      setProfile(result.user);
      setEditingProfile(false);
    } catch (err) {
      setEditError(parseApiError(err).message);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError('');

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setEditingPassword(false);
      // Optionally log out the user after password change
      // await logout();
    } catch (err) {
      setPasswordError(parseApiError(err).message);
    } finally {
      setPasswordSaving(false);
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-danger/20 bg-red-50 p-4 text-center">
          <p className="text-sm text-danger">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center text-slate">Profile not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-security-blue" />
          <h1 className="text-2xl font-semibold text-navy">My Profile</h1>
        </div>

        {/* Profile Section */}
        <div className="mt-6 rounded-lg border border-slate/10 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy">Personal Information</h2>
            <button
              onClick={() => (editingProfile ? setEditingProfile(false) : setEditingProfile(true))}
              className="rounded-lg bg-security-blue px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              {editingProfile ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {!editingProfile ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate">Full Name</p>
                <p className="mt-1 text-sm text-navy">{profile.full_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate">Email Address</p>
                <p className="mt-1 text-sm text-navy">{profile.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate">Username</p>
                <p className="mt-1 text-sm font-mono text-navy">{profile.username}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate">Role</p>
                <p className="mt-1 text-sm capitalize text-navy">{profile.role}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {editError && <p className="text-xs text-danger">{editError}</p>}
              <div>
                <label className="text-xs font-medium text-slate">Full Name</label>
                <input
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate/30 px-3 py-2 text-sm text-navy focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate/30 px-3 py-2 text-sm text-navy focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={editSaving}
                className="mt-4 w-full rounded-lg bg-security-blue py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-70"
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Password Section */}
        <div className="mt-6 rounded-lg border border-slate/10 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-security-blue" />
              <h2 className="text-lg font-semibold text-navy">Change Password</h2>
            </div>
            <button
              onClick={() => setEditingPassword(!editingPassword)}
              className="rounded-lg bg-security-blue px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              {editingPassword ? 'Cancel' : 'Change'}
            </button>
          </div>

          {editingPassword && (
            <div className="mt-4 space-y-3">
              {passwordError && <p className="text-xs text-danger">{passwordError}</p>}
              <div>
                <label className="text-xs font-medium text-slate">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate/30 px-3 py-2 text-sm text-navy focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate/30 px-3 py-2 text-sm text-navy focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate/30 px-3 py-2 text-sm text-navy focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="mt-4 w-full rounded-lg bg-security-blue py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-70"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          )}
        </div>

        {/* Activity Log Section */}
        <div className="mt-6">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-security-blue" />
            <h2 className="text-lg font-semibold text-navy">Activity Log</h2>
          </div>
          <div className="mt-4">
            <ActivityLog
              activityLog={activityLog}
              loading={activityLoading}
              error={activityError}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
