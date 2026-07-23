// src/components/Footer.jsx
//
// Shared footer for public marketing pages. Version number is read
// from package.json at build time via Vite's define/import rather
// than hardcoded twice in two places - see vite.config.js.

import { ShieldCheck } from 'lucide-react';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

export default function Footer() {
  return (
    <footer className="border-t border-landing-border bg-landing-bg px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-security-blue" />
            <span className="text-sm font-semibold text-landing-text">SDMS</span>
            <span className="text-xs text-landing-muted">v{APP_VERSION}</span>
          </div>
          <p className="max-w-md text-xs text-landing-muted">
            Built with OWASP Top 10-aligned security practices. Documents are stored securely
            and access is restricted to authenticated, authorized users only.
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-landing-muted/70 sm:text-left">
          © {new Date().getFullYear()} Secure Document Management System. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
