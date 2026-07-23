// src/pages/Register.jsx
//
// Field-level validation errors come straight from the backend's
// express-validator rules (middleware/validate.js) - this page
// doesn't duplicate that policy, it just displays whatever the
// backend decided was wrong. The one client-side-only check is
// password confirmation matching, which is pure UX (catching typos
// before a round trip) and never replaces the server's own rules.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Mail, IdCard, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { registerRequest } from '../services/authService';
import SecurityMesh from '../components/SecurityMesh';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import Loading from '../components/Loading';
import { parseApiError, toFieldErrorMap } from '../utils/apiErrorHandler';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      await registerRequest({
        username: form.username,
        email: form.email,
        full_name: form.full_name,
        password: form.password,
      });

      setSuccess(true);
      // Give the user a moment to see confirmation before sending
      // them to log in with their new credentials.
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const parsed = parseApiError(err);
      setFieldErrors(toFieldErrorMap(parsed.fieldErrors));
      if (parsed.fieldErrors.length === 0) {
        setGeneralError(parsed.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-4 py-10">
      <SecurityMesh />

      <div className="relative w-full max-w-md animate-fadeIn rounded-2xl bg-white p-8 shadow-card-hover sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-security-blue">
            <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2.25} />
          </div>
          <h1 className="text-xl font-semibold text-navy">Create your account</h1>
          <p className="mt-1 text-sm text-slate">Secure Document Management System</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 animate-checkPop text-success" strokeWidth={1.75} />
            <p className="mt-4 text-sm font-medium text-navy">Account created successfully.</p>
            <p className="mt-1 text-sm text-slate">Redirecting you to sign in…</p>
          </div>
        ) : (
          <>
            {generalError && (
              <div className="mb-5 rounded-lg border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
                {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-navy">
                  Full name
                </label>
                <div className="relative">
                  <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                  <input
                    id="full_name"
                    autoComplete="name"
                    value={form.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm text-navy transition-colors focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20 ${
                      fieldErrors.full_name ? 'border-danger' : 'border-slate/30'
                    }`}
                    placeholder="Jane Doe"
                  />
                </div>
                {fieldErrors.full_name && <p className="mt-1 text-xs text-danger">{fieldErrors.full_name}</p>}
              </div>

              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-navy">
                  Username
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                  <input
                    id="username"
                    autoComplete="username"
                    value={form.username}
                    onChange={(e) => updateField('username', e.target.value)}
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm text-navy transition-colors focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20 ${
                      fieldErrors.username ? 'border-danger' : 'border-slate/30'
                    }`}
                    placeholder="janedoe"
                  />
                </div>
                {fieldErrors.username && <p className="mt-1 text-xs text-danger">{fieldErrors.username}</p>}
              </div>

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
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
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
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm text-navy transition-colors focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20 ${
                      fieldErrors.password ? 'border-danger' : 'border-slate/30'
                    }`}
                    placeholder="At least 8 characters"
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
                <PasswordStrengthMeter password={form.password} />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-navy">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm text-navy transition-colors focus:border-security-blue focus:outline-none focus:ring-2 focus:ring-security-blue/20 ${
                      fieldErrors.confirmPassword ? 'border-danger' : 'border-slate/30'
                    }`}
                    placeholder="Re-enter your password"
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-danger">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-security-blue py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && <Loading size={16} />}
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-security-blue hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
