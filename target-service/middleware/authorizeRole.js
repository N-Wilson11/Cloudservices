module.exports = function authorizeRole() {
  var allowedRoles = Array.prototype.slice.call(arguments);

  return function(req, res, next) {
    if (!req.auth) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    if (allowedRoles.indexOf(req.auth.role) === -1) {
      return res.status(403).json({
        message: 'Forbidden for this role',
        requiredRoles: allowedRoles,
        currentRole: req.auth.role
      });
    }

    next();
  };
};
