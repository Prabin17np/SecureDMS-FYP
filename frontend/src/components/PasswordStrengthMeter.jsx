// src/components/PasswordStrengthMeter.jsx
//
// The checks here deliberately mirror middleware/validate.js's
// registerValidationRules() on the backend exactly (length 8+,
// upper, lower, number, special char) - this is a UI preview of the
// same policy the server enforces, not a separate/different
// standard. If the backend rule ever changes, this should change
// with it, or the meter will show "strong" for a password the
// server then rejects - which would be a confusing UX bug worth
// catching in testing.

const CHECKS = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-security-blue', 'bg-success'];

export default function PasswordStrengthMeter({ password }) {
  const passedCount = CHECKS.filter((check) => check.test(password)).length;
  const scoreIndex = password ? Math.max(passedCount - 1, 0) : -1;

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {CHECKS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= scoreIndex ? STRENGTH_COLORS[scoreIndex] : 'bg-slate/15'
            }`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs font-medium text-slate">
        {STRENGTH_LABELS[scoreIndex] || 'Very weak'}
      </p>
      <ul className="mt-1.5 grid grid-cols-1 gap-y-0.5 sm:grid-cols-2">
        {CHECKS.map((check) => {
          const passed = check.test(password);
          return (
            <li
              key={check.label}
              className={`text-xs ${passed ? 'text-success' : 'text-slate/70'}`}
            >
              {passed ? '✓' : '·'} {check.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
