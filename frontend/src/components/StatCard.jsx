// src/components/StatCard.jsx
//
// Reusable metric card. `tone` controls the accent color so status
// meaning stays consistent app-wide (e.g. account status uses
// 'success' when active, 'danger' when locked) rather than each
// page picking its own colors ad hoc.

const toneClasses = {
  default: 'bg-security-blue/10 text-security-blue',
  success: 'bg-green-100 text-success',
  warning: 'bg-amber-100 text-warning',
  danger: 'bg-red-100 text-danger',
  admin: 'bg-purple-100 text-admin-accent',
};

export default function StatCard({ icon: Icon, label, value, tone = 'default' }) {
  return (
    <div className="rounded-xl border border-slate/10 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate">{label}</p>
          <p className="truncate text-lg font-semibold text-navy">{value}</p>
        </div>
      </div>
    </div>
  );
}
