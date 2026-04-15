var jwt = require('jsonwebtoken');
var User = require('../models/User');
var env = require('../config/env');
var HttpError = require('../utils/HttpError');

module.exports = async function authenticate(req, res, next) {
  try {
    var authHeader = req.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing bearer token');
    }

    var token = authHeader.slice(7);
    var payload = jwt.verify(token, env.jwtSecret);
    var user = await User.findById(payload.userId);

    if (!user) {
      throw new HttpError(401, 'User not found');
    }

    req.user = user;
    req.auth = payload;
    next();
  } catch (error) {
    if (error.statusCode) {
      return next(error);
    }

    return next(new HttpError(401, 'Invalid token'));
  }
};
