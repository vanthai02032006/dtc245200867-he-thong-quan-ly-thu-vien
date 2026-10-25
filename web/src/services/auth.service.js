const UserModel = require('../models/user.model');
const generateToken = require('../utils/generateToken');
const AppError = require('../utils/AppError');
const { sessions } = require('../middlewares/auth.middleware');
const { metrics } = require('./system.service');

class AuthService {
  static async login({ username, password }) {
    const user = await UserModel.findByCredentials(username, password);
    if (!user) {
      metrics.authFailedTotal = (metrics.authFailedTotal || 0) + 1;
      console.warn(`[LOGIN_FAILED] ${new Date().toISOString()} | Failed login attempt for username="${username}"`);
      throw new AppError('Sai tài khoản hoặc mật khẩu! (Mặc định: admin / 123)', 401);
    }

    const token = generateToken();
    const sessionUser = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role || 'QUẢN TRỊ VIÊN',
    };
    sessions.set(token, sessionUser);
    metrics.authLoginsTotal++;
    console.log(`[AUTH_LOGIN] ${new Date().toISOString()} | User "${user.username}" (${user.full_name}) logged in successfully.`);
    return { token, user: sessionUser };
  }

  static async register({ username, password, full_name }) {
    try {
      const newUser = await UserModel.create({ username, password, full_name });
      const token = generateToken();
      const sessionUser = {
        id: newUser.id,
        username: newUser.username,
        full_name: newUser.full_name,
        role: newUser.role,
      };
      sessions.set(token, sessionUser);
      console.log(`[AUTH_REGISTER] Registered & logged in new user "${newUser.username}" (${newUser.full_name})`);
      return { token, user: sessionUser };
    } catch (err) {
      throw new AppError('Tên đăng nhập đã tồn tại hoặc dữ liệu không hợp lệ', 400);
    }
  }

  static logout(token) {
    const user = sessions.get(token);
    if (token && sessions.has(token)) {
      sessions.delete(token);
    }
    console.log(`[AUTH_LOGOUT] User "${user ? user.username : 'unknown'}" logged out.`);
    return { message: 'Đã đăng xuất thành công' };
  }
}

module.exports = AuthService;
