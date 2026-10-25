const AppError = require('../utils/AppError');

function validate(validatorFn) {
  return (req, res, next) => {
    const errorMsg = validatorFn(req.body);
    if (errorMsg) {
      return next(new AppError(errorMsg, 400));
    }
    next();
  };
}

module.exports = validate;
