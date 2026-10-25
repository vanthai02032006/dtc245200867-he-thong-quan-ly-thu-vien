const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { attachUser } = require('../middlewares/auth.middleware');
const { validateLogin, validateRegister } = require('../validators/auth.validator');

const router = express.Router();

router.post('/login', validate(validateLogin), authController.login);
router.post('/register', validate(validateRegister), authController.register);
router.post('/logout', authController.logout);
router.get('/me', attachUser, authController.getMe);

module.exports = router;
