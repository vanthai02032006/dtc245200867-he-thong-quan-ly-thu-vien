function validateCreateReader(body) {
  if (!body || !body.name || !body.email || !body.phone) {
    return 'Vui lòng điền đầy đủ họ tên, email và số điện thoại';
  }
  return null;
}

module.exports = {
  validateCreateReader,
};
