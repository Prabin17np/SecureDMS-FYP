// src/components/StorageUsage.jsx
//
// Displays user's storage usage as a progress bar + stats
// Shows: Used / Total limit
// Props:
// - usedBytes: number (bytes used)
// - limitBytes: number (total limit in bytes)

import { HardDrive } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';

export default function StorageUsage({ usedBytes = 0, limitBytes = 104857600 }) {
  // Default limit: 100 MB
  const percentUsed = (usedBytes / limitBytes) * 100;
  const percentColor =
    percentUsed > 90
      ? 'bg-danger'
      : percentUsed > 70
      ? 'bg-warning'
      : 'bg-success';

  const warnColor =
    percentUsed > 90
      ? 'text-danger'
      : percentUsed > 70
      ? 'text-warning'
      : 'text-success';

  return (
    <div className="rounded-lg border border-slate/10 bg-white p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <HardDrive className="h-5 w-5 text-slate" />
        <h3 className="font-semibold text-navy">Storage Usage</h3>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-slate-light rounded-full overflow-hidden">
          <div
            className={`h-full ${percentColor} transition-all duration-300`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate">Used</span>
          <span className={`text-sm font-semibold ${warnColor}`}>
            {formatFileSize(usedBytes)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate">Total</span>
          <span className="text-sm font-semibold text-navy">
            {formatFileSize(limitBytes)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate/10">
          <span className="text-sm text-slate">Available</span>
          <span className="text-sm font-semibold text-success">
            {formatFileSize(Math.max(0, limitBytes - usedBytes))}
          </span>
        </div>
      </div>

      {/* Warning if usage high */}
      {percentUsed > 90 && (
        <div className="mt-4 rounded-lg bg-red-50 border border-danger/20 p-3">
          <p className="text-xs text-danger">
            ⚠️ Storage is almost full. Delete some documents or contact admin.
          </p>
        </div>
      )}
      {percentUsed > 70 && percentUsed <= 90 && (
        <div className="mt-4 rounded-lg bg-yellow-50 border border-warning/20 p-3">
          <p className="text-xs text-warning">
            ⚠️ Storage usage is at {Math.round(percentUsed)}%.
          </p>
        </div>
      )}
    </div>
  );
}