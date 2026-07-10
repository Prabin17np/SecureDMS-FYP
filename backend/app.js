const express = require('express');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const sessionConfig = require('./config/session');

const app = express();

// Security headers
app.use(helmet());

// Parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(sessionConfig);

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