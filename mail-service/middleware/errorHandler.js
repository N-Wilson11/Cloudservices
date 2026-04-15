var logger = require('../utils/logger');

module.exports = function errorHandler(error, req, res, next) {
  var statusCode = error.statusCode || 500;
  var message = error.message || 'Internal server error';

  logger.error('request.failed', {
    method: req.method,
    path: req.originalUrl,
    statusCode: statusCode,
    message: message
  });

  res.status(statusCode).json({
    error: {
      message: message
    }
  });
};
