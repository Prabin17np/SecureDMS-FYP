// src/pages/Home.jsx
//
// Public landing page at "/". If the visitor already has a valid
// session, we redirect straight to /dashboard rather than showing
// the marketing page to someone who's already logged in.
//
// Nothing on this page reads from the backend - it's static
// marketing content, so there's no risk of it accidentally rendering
// fake/mock document or user data.
//
// Color/contrast notes (see also tailwind.config.js):
// - Background is `landing-bg` (#0B1120), a dark navy - never pure
//   black, and kept distinct from the app shell's `navy` (#0F172A)
//   used for the authenticated Sidebar/Navbar.
// - Cards use `landing-card` (rgba(255,255,255,0.05)) with
//   `landing-border` (rgba(255,255,255,0.1)) for the glassmorphism
//   look, plus backdrop-blur.
// - Primary text uses `landing-text` (#F8FAFC) - never a dark color
//   on this dark background.
// - Secondary/muted text uses `landing-muted` (#94A3B8), chosen
//   specifically because it still passes contrast against #0B1120,
//   unlike darker grays that would be too close to the background.
// - Status accents use `landing-success` / `landing-danger`
//   (#22C55E / #EF4444) - a separate, brighter pair from the app's
//   lighter-theme `success`/`danger` tokens, since this dark
//   background needs more luminance to stay legible.

import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  UploadCloud,
  Users,
  KeyRound,
  Server,
  FolderLock,
  CheckCircle2,
  UserPlus,
  FileUp,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import SecurityMesh from '../components/SecurityMesh';

const FEATURES = [
  { icon: FolderLock, title: 'Secure Document Storage', description: 'Files are stored with randomized identifiers and never exposed by direct URL.' },
  { icon: Users, title: 'Role-Based Access Control', description: 'Standard users and administrators see only what their role permits.' },
  { icon: UploadCloud, title: 'Protected Uploads and Downloads', description: 'Every upload is validated by type and size before it ever touches disk.' },
  { icon: KeyRound, title: 'Session-Based Authentication', description: 'No tokens in browser storage - session state lives server-side only.' },
  { icon: ShieldCheck, title: 'OWASP Security Practices', description: 'Built around OWASP Top 10 principles from the ground up.' },
];

const HOW_IT_WORKS = [
  { icon: UserPlus, step: '01', title: 'Create Account', description: 'Register with a secured, validated password policy in under a minute.' },
  { icon: FileUp, step: '02', title: 'Upload Documents Securely', description: 'Files are checked, randomized, and stored - never trusted as-is.' },
  { icon: FolderOpen, step: '03', title: 'Manage and Access Files', description: 'View, download, or remove your documents, scoped strictly to your account.' },
];

const WHY_CHOOSE = [
  'Protect sensitive documents',
  'Control user permissions',
  'Secure backend communication',
  'Enterprise-ready architecture',
];

const SECURITY_HIGHLIGHTS = [
  'Express session authentication',
  'PostgreSQL database',
  'Protected API communication',
  'Ownership-based document access',
];

const TECH_STACK = [
  { label: 'React + Vite', detail: 'Frontend framework & tooling' },
  { label: 'Express.js', detail: 'Backend API server' },
  { label: 'PostgreSQL', detail: 'Relational database' },
  { label: 'Axios', detail: 'HTTP client with credentialed requests' },
  { label: 'React Router', detail: 'Client-side routing' },
];

// Shared viewport-reveal settings so cards fade/slide in once, as the
// user scrolls to them, rather than all firing on initial page load.
const revealProps = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-landing-bg">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <SecurityMesh />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-security-blue shadow-card-hover"
          >
            <ShieldCheck className="h-7 w-7 text-landing-text" strokeWidth={2} />
          </motion.div>
          <h1 className="text-3xl font-bold text-landing-text sm:text-5xl">
            Secure Document Management System
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-landing-muted sm:text-lg">
            Enterprise-grade document security with protected storage, role-based access
            control, and secure file management.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="w-full rounded-lg bg-security-blue px-6 py-3 text-sm font-medium text-landing-text transition-colors hover:bg-blue-700 sm:w-auto"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="w-full rounded-lg border border-landing-border bg-landing-card px-6 py-3 text-sm font-medium text-landing-text backdrop-blur-md transition-colors hover:bg-white/10 sm:w-auto"
            >
              Register
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2 {...revealProps} className="text-center text-2xl font-semibold text-landing-text">
            Features
          </motion.h2>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-landing-border bg-landing-card p-6 backdrop-blur-md transition-colors hover:bg-white/[0.08]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-security-blue/20 text-security-blue">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-landing-text">{title}</h3>
                <p className="mt-1.5 text-sm text-landing-muted">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <motion.h2 {...revealProps} className="text-center text-2xl font-semibold text-landing-text">
            How It Works
          </motion.h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, description }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: 'easeOut' }}
                className="relative rounded-2xl border border-landing-border bg-landing-card p-6 backdrop-blur-md"
              >
                <span className="text-xs font-semibold tracking-widest text-security-blue">
                  STEP {step}
                </span>
                <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-lg bg-security-blue/20 text-security-blue">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-landing-text">{title}</h3>
                <p className="mt-1.5 text-sm text-landing-muted">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose SDMS */}
      <section className="px-4 py-16 sm:px-6">
        <motion.div
          {...revealProps}
          className="mx-auto max-w-4xl rounded-2xl border border-landing-border bg-landing-card p-8 backdrop-blur-md sm:p-10"
        >
          <h2 className="text-xl font-semibold text-landing-text">Why Choose SDMS</h2>
          <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {WHY_CHOOSE.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-landing-muted">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-landing-success" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </section>

      {/* Security Highlights */}
      <section className="px-4 py-16 sm:px-6">
        <motion.div
          {...revealProps}
          className="mx-auto max-w-4xl rounded-2xl border border-landing-border bg-landing-card p-8 backdrop-blur-md sm:p-10"
        >
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-security-blue" />
            <h2 className="text-xl font-semibold text-landing-text">Security Highlights</h2>
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {SECURITY_HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-landing-muted">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-landing-success" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </section>

      {/* Technology Stack */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div {...revealProps} className="flex items-center justify-center gap-2">
            <Server className="h-5 w-5 text-security-blue" />
            <h2 className="text-2xl font-semibold text-landing-text">Technology Stack</h2>
          </motion.div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {TECH_STACK.map(({ label, detail }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: 'easeOut' }}
                className="rounded-xl border border-landing-border bg-landing-card p-4 text-center backdrop-blur-md"
              >
                <p className="text-sm font-semibold text-landing-text">{label}</p>
                <p className="mt-1 text-xs text-landing-muted">{detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mx-auto max-w-3xl rounded-2xl border border-security-blue/30 bg-gradient-to-br from-security-blue/10 to-white/5 p-10 text-center backdrop-blur-md"
        >
          <h2 className="text-2xl font-semibold text-landing-text sm:text-3xl">
            Ready to secure your documents?
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-security-blue px-6 py-3 text-sm font-medium text-landing-text transition-colors hover:bg-blue-700 sm:w-auto"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="w-full rounded-lg border border-landing-border bg-landing-card px-6 py-3 text-sm font-medium text-landing-text backdrop-blur-md transition-colors hover:bg-white/10 sm:w-auto"
            >
              Login
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
