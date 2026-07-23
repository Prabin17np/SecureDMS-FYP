// src/components/RecentActivityWidget.jsx

import { Activity } from 'lucide-react';
import { formatDate } from '../utils/formatters';

const ACTION_ICONS = {
  upload: '📤',
  delete: '🗑️',
  login: '🔓',
  logout: '🔒',
  password_change: '🔑',
  update: '✏️',
  download: '⬇️',
};

export default function RecentActivityWidget({ activities = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate/10 bg-white p-6 shadow-card">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-light rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate/10 bg-white p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="h-5 w-5 text-slate" />
        <h3 className="font-semibold text-navy">Recent Activity</h3>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-slate">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 pb-3 border-b border-slate/10 last:border-b-0"
            >
              <div className="text-2xl flex-shrink-0">
                {ACTION_ICONS[activity.action_type] || '📝'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy capitalize">
                  {activity.action_type.replace('_', ' ')}
                </p>
                <p className="text-xs text-slate/60 truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-slate/40">
                  {formatDate(activity.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}