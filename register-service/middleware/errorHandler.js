var logger = require('../utils/logger');

module.exports = function errorHandler(error, req, res, next) {
  var statusCode = error.statusCode || 500;
  var message = error.message || 'Internal server error';

  if (error && error.code === 11000) {
    statusCode = 409;
    message = 'Registration already exists';
  }

  if (error && error.name === 'ValidationError') {
    statusCode = 400;
  }

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
