const express = require('express');
const authRoutes = require('./auth.routes');
const bookRoutes = require('./book.routes');
const readerRoutes = require('./reader.routes');
const loanRoutes = require('./loan.routes');
const systemController = require('../controllers/system.controller');

const router = express.Router();

router.get('/stats', systemController.getStats);
router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/readers', readerRoutes);
router.use('/loans', loanRoutes);

module.exports = router;
