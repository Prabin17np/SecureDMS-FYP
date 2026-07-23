// src/main.jsx
//
// App entry point. BrowserRouter wraps everything so React Router
// works throughout the app. AuthProvider (added in Step 2) wraps
// App here too, so auth/session state is available to every page
// without prop-drilling.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
