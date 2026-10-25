function validateCreateLoan(body) {
  if (!body || !body.book_id || !body.reader_id) {
    return 'Vui lòng chọn sách và độc giả';
  }
  return null;
}

module.exports = {
  validateCreateLoan,
};
