var HttpError = require('../utils/HttpError');

module.exports = function notFoundHandler(req, res, next) {
  next(new HttpError(404, 'Route not found'));
};
