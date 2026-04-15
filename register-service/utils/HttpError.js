function HttpError(statusCode, message) {
  this.name = 'HttpError';
  this.statusCode = statusCode;
  this.message = message;
  Error.captureStackTrace(this, HttpError);
}

HttpError.prototype = Object.create(Error.prototype);
HttpError.prototype.constructor = HttpError;

module.exports = HttpError;
