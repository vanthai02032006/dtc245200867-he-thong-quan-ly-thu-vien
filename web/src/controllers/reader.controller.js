const ReaderService = require('../services/reader.service');
const catchAsync = require('../utils/catchAsync');

const getReaders = catchAsync(async (req, res) => {
  const readers = await ReaderService.getReaders();
  res.json(readers);
});

const createReader = catchAsync(async (req, res) => {
  const reader = await ReaderService.createReader(req.body);
  res.status(201).json(reader);
});

const deleteReader = catchAsync(async (req, res) => {
  const result = await ReaderService.deleteReader(req.params.id);
  res.json(result);
});

module.exports = {
  getReaders,
  createReader,
  deleteReader,
};
