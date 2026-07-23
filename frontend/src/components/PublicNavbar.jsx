// src/components/PublicNavbar.jsx
//
// Nav bar for the public-facing pages (Home, Contact) when the
// visitor is NOT authenticated. Authenticated visitors to /contact
// get the app's normal DashboardLayout (Sidebar + Navbar) instead -
// see pages/Contact.jsx for that branch. This component intentionally
// has no auth-aware logic itself; the pages that render it already
// know the visitor is logged out before choosing to render this.

import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShieldCheck, Menu, X } from 'lucide-react';

const linkClasses = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-landing-text' : 'text-landing-muted hover:text-landing-text'
  }`;

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-landing-border bg-landing-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-security-blue">
            <ShieldCheck className="h-4 w-4 text-landing-text" strokeWidth={2.25} />
          </div>
          <span className="text-sm font-semibold text-landing-text">SDMS</span>
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          <NavLink to="/" end className={linkClasses}>
            Home
          </NavLink>
          <NavLink to="/contact" className={linkClasses}>
            Contact
          </NavLink>
          <NavLink to="/login" className={linkClasses}>
            Login
          </NavLink>
          <Link
            to="/register"
            className="rounded-lg bg-security-blue px-4 py-2 text-sm font-medium text-landing-text transition-colors hover:bg-blue-700"
          >
            Register
          </Link>
        </nav>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="text-landing-muted hover:text-landing-text sm:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-landing-border px-4 py-3 sm:hidden">
          <NavLink to="/" end className={linkClasses} onClick={() => setMobileOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/contact" className={linkClasses} onClick={() => setMobileOpen(false)}>
            Contact
          </NavLink>
          <NavLink to="/login" className={linkClasses} onClick={() => setMobileOpen(false)}>
            Login
          </NavLink>
          <NavLink to="/register" className={linkClasses} onClick={() => setMobileOpen(false)}>
            Register
          </NavLink>
        </nav>
      )}
    </header>
  );
}
