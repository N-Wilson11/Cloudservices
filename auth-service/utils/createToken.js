var jwt = require('jsonwebtoken');
var env = require('../config/env');

module.exports = function createToken(user) {
  return jwt.sign({
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
};
