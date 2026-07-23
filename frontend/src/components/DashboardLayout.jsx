// src/components/DashboardLayout.jsx
//
// Shared shell for every authenticated page (Dashboard, Documents,
// AdminDashboard) so the sidebar/navbar/mobile-toggle logic exists
// in exactly one place rather than being copy-pasted into each page.

import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 animate-fadeIn p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
