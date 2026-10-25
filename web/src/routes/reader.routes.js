const express = require('express');
const readerController = require('../controllers/reader.controller');
const validate = require('../middlewares/validate.middleware');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validateCreateReader } = require('../validators/reader.validator');

const router = express.Router();

router.get('/', readerController.getReaders);
router.post('/', requireAuth, validate(validateCreateReader), readerController.createReader);
router.delete('/:id', requireAuth, readerController.deleteReader);

module.exports = router;
