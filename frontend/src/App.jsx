// src/App.jsx
//
// Route map with security logs page for admins

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Admin from './pages/Admin';
import SecurityLogs from './pages/SecurityLogs';
import Profile from './pages/Profile';
import Users from './pages/Users';
import ProtectedRoute from './components/ProtectedRoute';

// Wrapper component that redirects admins to /admin
function DashboardRoute() {
  const { user } = useAuth();
  
  // If user is admin, redirect to /admin instead
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  // Regular users see Dashboard
  return <Dashboard />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRoute />
          </ProtectedRoute>
        }
      />

      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <Admin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/security-logs"
        element={
          <ProtectedRoute requireAdmin>
            <SecurityLogs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute requireAdmin>
            <Users />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;