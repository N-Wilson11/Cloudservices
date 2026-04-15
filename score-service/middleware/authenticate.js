var jwt = require('jsonwebtoken');

var env = require('../config/env');
var HttpError = require('../utils/HttpError');

module.exports = function authenticate(req, res, next) {
  try {
    var authHeader = req.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing bearer token');
    }

    var token = authHeader.slice(7);
    var payload = jwt.verify(token, env.jwtSecret);

    req.token = token;
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch (error) {
    if (error.statusCode) {
      return next(error);
    }

    next(new HttpError(401, 'Invalid token'));
  }
};
