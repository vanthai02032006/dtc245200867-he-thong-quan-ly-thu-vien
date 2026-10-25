const AppError = require('../utils/AppError');

const sessions = new Map();

function extractToken(req) {
  const authHeader = req.headers.authorization || '';
  return authHeader.replace('Bearer ', '').trim();
}

function attachUser(req, res, next) {
  const token = extractToken(req);
  if (token && sessions.has(token)) {
    req.user = sessions.get(token);
    req.token = token;
  }
  next();
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token || !sessions.has(token)) {
    return next(new AppError('Vui lòng đăng nhập để sử dụng chức năng quản lý này!', 401));
  }
  req.user = sessions.get(token);
  req.token = token;
  next();
}

module.exports = {
  sessions,
  extractToken,
  attachUser,
  requireAuth,
};
