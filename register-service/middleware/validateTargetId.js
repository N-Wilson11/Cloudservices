var HttpError = require('../utils/HttpError');

function isValidObjectId(value) {
  return /^[a-f0-9]{24}$/i.test(String(value || '').trim());
}

module.exports = function validateTargetId(req, res, next) {
  if (!req.params.targetId || typeof req.params.targetId !== 'string' || !req.params.targetId.trim()) {
    return next(new HttpError(400, 'targetId is required'));
  }

  if (!isValidObjectId(req.params.targetId)) {
    return next(new HttpError(400, 'targetId must be a valid ObjectId'));
  }

  next();
};
