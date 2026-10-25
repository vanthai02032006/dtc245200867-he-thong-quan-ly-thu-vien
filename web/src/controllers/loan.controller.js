const LoanService = require('../services/loan.service');
const catchAsync = require('../utils/catchAsync');

const getLoans = catchAsync(async (req, res) => {
  const loans = await LoanService.getLoans();
  res.json(loans);
});

const createLoan = catchAsync(async (req, res) => {
  const loan = await LoanService.borrowBook(req.body);
  res.status(201).json(loan);
});

const returnLoan = catchAsync(async (req, res) => {
  const result = await LoanService.returnBook(req.params.id);
  res.json(result);
});

module.exports = {
  getLoans,
  createLoan,
  returnLoan,
};
