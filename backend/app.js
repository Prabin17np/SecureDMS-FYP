const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const sessionConfig = require('./config/session');
const documentRoutes = require('./routes/documents');
const userRoutes = require('./routes/users');
const securityRoutes = require('./routes/security');
const app = express();

// Security headers.
// crossOriginResourcePolicy is relaxed from Helmet's default
// ('same-origin') because the frontend (localhost:5173) and this API
// (localhost:5000) are different origins by design in dev. Left at
// the default, Helmet's own header would block the frontend's fetches
// even after CORS below is configured correctly - this is a common
// gotcha when frontend and backend run on separate ports.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'self'", "http://localhost:5173"], // Allow backend to be embedded in frontend iframe
      imgSrc: ["'self'", "data:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
}));

// CORS - required because the frontend sends withCredentials: true
// (it has to, to carry the session cookie). Two things matter here:
// 1. origin must be an explicit URL, never '*' - browsers reject
//    wildcard origins outright for credentialed requests.
// 2. credentials: true must be set here to match withCredentials on
//    the client, or the browser drops the session cookie entirely.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(sessionConfig);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/security', securityRoutes);

// Health check
app.get('/', (req, res) => {
res.json({
message: 'SecureDMS API running'
});
});

// Error handler
app.use((err, req, res, next) => {
console.error(err.message);

res.status(500).json({
message: 'Internal server error'
});
});

module.exports = app;