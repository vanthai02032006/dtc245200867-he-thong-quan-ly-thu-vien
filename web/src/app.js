const express = require('express');
const path = require('path');
const apiRoutes = require('./routes');
const systemController = require('./controllers/system.controller');
const errorHandler = require('./middlewares/error.middleware');
const { metrics } = require('./services/system.service');

const app = express();

// Hardening: Ẩn header X-Powered-By của Express
app.disable('x-powered-by');

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware ghi Log tập trung (cho Promtail / Loki) & đếm Metrics
app.use((req, res, next) => {
  const start = Date.now();
  metrics.httpRequestsTotal++;
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 500) {
      metrics.httpErrorsTotal++;
      console.error(
        `[ERROR] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | ${duration}ms`
      );
    } else {
      console.log(
        `[INFO] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | ${duration}ms`
      );
    }
  });
  next();
});

// Phục vụ Frontend Static Files (web/src/public/)
app.use(express.static(path.join(__dirname, 'public')));

// System & Monitoring Endpoints
app.get('/health', systemController.getHealth);
app.get('/metrics', systemController.getMetrics);
app.get('/test-error', systemController.triggerTestError);

// API Routes
app.use('/api', apiRoutes);

// Global Error Handling Middleware
app.use(errorHandler);

module.exports = app;
