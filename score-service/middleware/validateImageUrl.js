var HttpError = require('../utils/HttpError');

module.exports = function validateImageUrl(req, res, next) {
  if (!req.body.imageUrl || !String(req.body.imageUrl).trim()) {
    return next(new HttpError(400, 'imageUrl is required'));
  }

  next();
};
