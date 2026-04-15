var jwt = require('jsonwebtoken');

module.exports = function authenticate(req, res, next) {
  try {
    var authHeader = req.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Missing bearer token'
      });
    }

    var token = authHeader.slice(7);
    var payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');

    req.auth = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }
};
