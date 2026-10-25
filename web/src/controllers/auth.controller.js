const AuthService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const { extractToken } = require('../middlewares/auth.middleware');

const login = catchAsync(async (req, res) => {
  const result = await AuthService.login(req.body);
  res.json(result);
});

const register = catchAsync(async (req, res) => {
  const result = await AuthService.register(req.body);
  res.status(201).json(result);
});

const logout = (req, res) => {
  const token = extractToken(req);
  const result = AuthService.logout(token);
  res.json(result);
};

const getMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true, user: req.user });
};

module.exports = {
  login,
  register,
  logout,
  getMe,
};
