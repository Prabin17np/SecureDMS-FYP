// src/components/ActivityLog.jsx
//
// Displays a table of activity log entries (login, logout, upload, delete,
// etc.). Used by both Profile.jsx (user viewing their own log) and Users.jsx
// (admin viewing a user's log). Activity type is a visual badge, timestamp
// is formatted, and IP is shown for auditing purposes.

import { Calendar, MapPin, Activity } from 'lucide-react';
import { formatDate } from '../utils/formatters';

const ACTION_COLORS = {
  login: 'bg-success/10 text-success',
  logout: 'bg-slate/10 text-slate',
  upload: 'bg-security-blue/10 text-security-blue',
  update: 'bg-security-blue/10 text-security-blue',
  delete: 'bg-danger/10 text-danger',
  password_change: 'bg-warning/10 text-warning',
};

export default function ActivityLog({ activityLog, loading = false, error = null }) {
  if (error) {
    return (
      <div className="rounded-lg border border-danger/20 bg-red-50 p-4">
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-slate/10 bg-white p-8 text-center">
        <p className="text-sm text-slate">Loading activity log...</p>
      </div>
    );
  }

  if (!activityLog || activityLog.length === 0) {
    return (
      <div className="rounded-lg border border-slate/10 bg-white p-8 text-center">
        <Activity className="mx-auto mb-2 h-6 w-6 text-slate/50" />
        <p className="text-sm text-slate">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate/10 bg-white shadow-card">
      <table className="w-full text-sm">
        <thead className="border-b border-slate/10 bg-app-bg">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-navy">Action</th>
            <th className="px-4 py-3 text-left font-semibold text-navy">Description</th>
            <th className="px-4 py-3 text-left font-semibold text-navy">Timestamp</th>
            <th className="px-4 py-3 text-left font-semibold text-navy">IP Address</th>
          </tr>
        </thead>
        <tbody>
          {activityLog.map((entry) => (
            <tr key={entry.id} className="border-b border-slate/10 hover:bg-app-bg/50">
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium ${
                    ACTION_COLORS[entry.action_type] || 'bg-slate/10 text-slate'
                  }`}
                >
                  {entry.action_type}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-slate">{entry.description}</span>
              </td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-1.5 text-slate">
                  <Calendar className="h-3.5 w-3.5 text-slate/60" />
                  {formatDate(entry.created_at)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-1.5 font-mono text-slate">
                  <MapPin className="h-3.5 w-3.5 text-slate/60" />
                  {entry.ip_address}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
