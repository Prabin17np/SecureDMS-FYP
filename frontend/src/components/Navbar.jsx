// src/components/Navbar.jsx
//
// Fixed top bar: mobile menu toggle, page context, and the user
// profile dropdown (logout lives here). Logout calls AuthContext's
// logout(), which calls the real POST /api/auth/logout endpoint -
// this is not just a client-side "forget the user" action, it
// actually destroys the server-side session (see authController.js).

import { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '??';

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate/10 bg-white px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        className="text-slate hover:text-navy lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-app-bg"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-security-blue text-xs font-semibold text-white">
            {initials}
          </div>
          <span className="hidden text-sm font-medium text-navy sm:block">{user?.username}</span>
          <ChevronDown className="h-4 w-4 text-slate" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 animate-fadeIn rounded-lg border border-slate/10 bg-white py-1 shadow-card-hover">
            <div className="border-b border-slate/10 px-4 py-2.5">
              <p className="text-sm font-medium text-navy">{user?.username}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate">
                <User className="h-3 w-3" />
                {user?.role === 'admin' ? 'Administrator' : 'User'}
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
