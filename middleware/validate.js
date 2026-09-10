const { validationResult } = require('express-validator');

// Runs after an array of express-validator checks on a route. If any check
// failed, responds with a consistent 400 JSON error instead of letting the
// request reach the controller/business logic.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;
