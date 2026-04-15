var HttpError = require('../utils/HttpError');

module.exports = function authorizeRole() {
  var allowedRoles = Array.prototype.slice.call(arguments);

  return function(req, res, next) {
    if (!req.user) {
      return next(new HttpError(401, 'Authentication required'));
    }

    if (allowedRoles.indexOf(req.user.role) === -1) {
      return next(new HttpError(403, 'Forbidden for this role'));
    }

    next();
  };
};
