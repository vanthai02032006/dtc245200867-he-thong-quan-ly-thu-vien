const express = require('express');
const loanController = require('../controllers/loan.controller');
const validate = require('../middlewares/validate.middleware');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validateCreateLoan } = require('../validators/loan.validator');

const router = express.Router();

router.get('/', loanController.getLoans);
router.post('/', requireAuth, validate(validateCreateLoan), loanController.createLoan);
router.post('/:id/return', requireAuth, loanController.returnLoan);

module.exports = router;
