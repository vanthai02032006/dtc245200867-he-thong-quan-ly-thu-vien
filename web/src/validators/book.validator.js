function validateCreateBook(body) {
  if (!body || !body.title || !body.author) {
    return 'Vui lòng nhập tên sách và tác giả';
  }
  return null;
}

module.exports = {
  validateCreateBook,
};
