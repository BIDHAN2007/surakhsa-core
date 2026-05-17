const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const isProd = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', require('./auth-routes'));
app.use('/api/vitals', require('./vitals-routes'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Surakhsa Core - Smart Healthcare Emergency Monitoring System',
  });
});

// Serve React build in production
if (isProd) {
  const buildPath = path.join(__dirname, 'frontend', 'build');
  app.use(express.static(buildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`\nSurakhsa Core server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  if (isProd) console.log('Serving frontend from frontend/build');
});
