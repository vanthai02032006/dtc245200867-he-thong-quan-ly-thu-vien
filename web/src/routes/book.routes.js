const express = require('express');
const bookController = require('../controllers/book.controller');
const validate = require('../middlewares/validate.middleware');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validateCreateBook } = require('../validators/book.validator');

const router = express.Router();

router.get('/', bookController.getBooks);
router.post('/', requireAuth, validate(validateCreateBook), bookController.createBook);
router.delete('/:id', requireAuth, bookController.deleteBook);

module.exports = router;
