// src/components/Sidebar.jsx
//
// Left sidebar navigation with role-aware menu items

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, ShieldCheck, Mail, User, Users, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navItemClasses = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-slate hover:bg-slate-light'
    }`;

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-navy transform transition-transform duration-300 lg:static lg:translate-x-0 z-40 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-500/20">
            <ShieldCheck className="h-6 w-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white">SDMS</h2>
            <button
              onClick={onClose}
              className="ml-auto lg:hidden text-white hover:bg-navy-light rounded p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
            {/* Dashboard - different link for admin vs user */}
            <NavLink
              to={isAdmin ? '/admin' : '/dashboard'}
              className={navItemClasses}
              onClick={onClose}
            >
              <LayoutDashboard className="h-4 w-4" />
              {isAdmin ? 'Admin Overview' : 'Dashboard'}
            </NavLink>

            {/* Documents */}
            <NavLink to="/documents" className={navItemClasses} onClick={onClose}>
              <FileText className="h-4 w-4" />
              Documents
            </NavLink>

            {/* Security Logs (admin only) */}
            {isAdmin && (
              <NavLink to="/security-logs" className={navItemClasses} onClick={onClose}>
                <AlertCircle className="h-4 w-4" />
                Security Logs
              </NavLink>
            )}

            {/* Users (admin only) */}
            {isAdmin && (
              <NavLink to="/users" className={navItemClasses} onClick={onClose}>
                <Users className="h-4 w-4" />
                Users
              </NavLink>
            )}

            {/* Contact */}
            <NavLink to="/contact" className={navItemClasses} onClick={onClose}>
              <Mail className="h-4 w-4" />
              Contact
            </NavLink>

            {/* Profile */}
            <NavLink to="/profile" className={navItemClasses} onClick={onClose}>
              <User className="h-4 w-4" />
              Profile
            </NavLink>
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-blue-500/20 text-xs text-blue-200">
            <p>Secure Document Management System</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}