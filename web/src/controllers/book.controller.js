const BookService = require('../services/book.service');
const catchAsync = require('../utils/catchAsync');

const getBooks = catchAsync(async (req, res) => {
  const books = await BookService.getBooks(req.query.search || '');
  res.json(books);
});

const createBook = catchAsync(async (req, res) => {
  const book = await BookService.createBook(req.body);
  res.status(201).json(book);
});

const deleteBook = catchAsync(async (req, res) => {
  const result = await BookService.deleteBook(req.params.id);
  res.json(result);
});

module.exports = {
  getBooks,
  createBook,
  deleteBook,
};
