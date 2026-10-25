function validateLogin(body) {
  if (!body || !body.username || !body.password) {
    return 'Vui lòng nhập tên đăng nhập và mật khẩu';
  }
  return null;
}

function validateRegister(body) {
  if (!body || !body.username || !body.password || !body.full_name) {
    return 'Vui lòng điền đầy đủ Họ tên, Tài khoản và Mật khẩu';
  }
  return null;
}

module.exports = {
  validateLogin,
  validateRegister,
};
