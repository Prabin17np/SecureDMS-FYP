// src/hooks/useAuth.js
//
// Separated from context/AuthContext.jsx so consuming components
// import the hook from a conventional `hooks/` location rather than
// reaching into the context module directly. AuthContext.jsx still
// owns the actual state/logic (login, logout, session verification) -
// this file is just the access point.

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
