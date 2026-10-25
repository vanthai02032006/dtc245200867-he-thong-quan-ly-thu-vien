const { SystemService } = require('../services/system.service');
const catchAsync = require('../utils/catchAsync');

const getHealth = catchAsync(async (req, res) => {
  const health = await SystemService.getHealth();
  res.json(health);
});

const getStats = catchAsync(async (req, res) => {
  const stats = await SystemService.getStats();
  res.json(stats);
});

const getMetrics = catchAsync(async (req, res) => {
  const text = await SystemService.getPrometheusMetrics();
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(text);
});

const triggerTestError = (req, res) => {
  console.error('ERROR: Exception occurred when processing book loan request!');
  res.status(500).send('Simulated HTTP 500 Error for Loki LogQL Testing');
};

module.exports = {
  getHealth,
  getStats,
  getMetrics,
  triggerTestError,
};
