// src/pages/Login.jsx
//
// Handles three distinct failure modes the backend can return, and
// deliberately shows different UI for each:
//   400 - validation failed (empty fields etc.) -> inline field errors
//   401 - wrong email/password -> generic red banner (never reveals
//         whether the email exists - matches the backend's own
//         refusal to distinguish these cases)
//   403 - account locked -> distinct amber banner, different message,
//         because the user genuinely needs different information here
//         (wait and retry, vs. re-check credentials)

import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import SecurityMesh from '../components/SecurityMesh';
import Loading from '../components/Loading';
import { parseApiError, toFieldErrorMap } from '../utils/apiErrorHandler';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [locked, setLocked] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // If ProtectedRoute redirected here, send the user back to where
  // they were headed after a successful login instead of always /dashboard.
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    setGeneralError('');
    setLocked(false);
    setFieldErrors({});
    setLoading(true);

    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const parsed = parseApiError(err);
      setFieldErrors(toFieldErrorMap(parsed.fieldErrors));

      if (parsed.status === 403 || parsed.locked) {
        setLocked(true);
      }
      // Only show a general banner if there isn't a more specific
      // field-level error already covering it.
      if (parsed.fieldErrors.length === 0) {
        setGeneralError(parsed.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-4">
      <SecurityMesh />

      <div className="relative w-full max-w-md animate-fadeIn rounded-2xl bg-white p-8 shadow-card-hover sm:p-10">
        {/* Logo / identity area */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-security-blue">
            <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2.25} />
          </div>
          <h1 className="text-xl font-semibold text-navy">Sign in to SDMS</h1>
          <p className="mt-1 text-sm text-slate">Secure Document Management System</p>
        </div>

        {locked && (
          <div className="mb-5 rounded-lg border border-warning/30 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong className="font-medium">Account temporarily locked.</strong>{' '}
            {generalError || 'Too many failed attempts. Please try again later.'}
          </div>
        )}

        {!locked && generalError && (
          <div className="mb-5 rounded-lg border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm text-navy transition-colors focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20 ${
                  fieldErrors.email ? 'border-danger' : 'border-slate/30'
                }`}
                placeholder="you@company.com"
              />
            </div>
            {fieldErrors.email && <p className="mt-1 text-xs text-danger">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm text-navy transition-colors focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20 ${
                  fieldErrors.password ? 'border-danger' : 'border-slate/30'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-navy"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1 text-xs text-danger">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-security-blue py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading && <Loading size={16} />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-security-blue hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
