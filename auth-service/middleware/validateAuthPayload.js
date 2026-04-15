var HttpError = require('../utils/HttpError');

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

module.exports = function validateAuthPayload(req, res, next) {
  if (!req.body.email || !req.body.password) {
    return next(new HttpError(400, 'Email and password are required'));
  }

  if (!isValidEmail(req.body.email)) {
    return next(new HttpError(400, 'Email must be a valid email address'));
  }

  if (String(req.body.password).length < 6) {
    return next(new HttpError(400, 'Password must be at least 6 characters long'));
  }

  next();
};
