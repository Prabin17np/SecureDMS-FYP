// src/components/Loading.jsx
//
// Small reusable spinner used inside buttons during API calls and
// for full-page loading states (e.g. AuthContext's initial session
// check). Kept as one component so the "loading" visual language is
// consistent everywhere instead of different spinners per page.

export default function Loading({ size = 18, className = '' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
      role="status"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
      />
    </svg>
  );
}
