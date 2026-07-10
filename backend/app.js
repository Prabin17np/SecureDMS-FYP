const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();

// Security headers
app.use(helmet());

// Parse JSON requests
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // change to true when using HTTPS
      maxAge: 1000 * 60 * 30 // 30 minutes
    }
  })
);

// Routes
app.use('/api/auth', authRoutes);

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