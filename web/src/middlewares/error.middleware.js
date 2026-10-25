function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ';

  if (statusCode >= 500) {
    console.error(`ERROR: [${req.method} ${req.originalUrl}] ${message}`);
  }

  res.status(statusCode).json({
    error: message,
  });
}

module.exports = errorHandler;
