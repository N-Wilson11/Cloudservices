var authService = require('../services/authService');

exports.health = function(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'auth-service'
  });
};

exports.register = async function(req, res) {
  var result = await authService.registerUser(req.body);
  res.status(201).json(result);
};

exports.login = async function(req, res) {
  var result = await authService.loginUser(req.body);
  res.status(200).json(result);
};

exports.me = function(req, res) {
  res.status(200).json({
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt
    }
  });
};

exports.listUsers = async function(req, res) {
  var result = await authService.listUsers();
  res.status(200).json(result);
};

exports.getUserById = async function(req, res) {
  var requestedUserId = String(req.params.userId || '');
  var isTargetOwner = req.user && req.user.role === 'target-owner';
  var isSelf = req.auth && String(req.auth.userId || '') === requestedUserId;

  if (!isTargetOwner && !isSelf) {
    return res.status(403).json({
      error: 'Forbidden for this role'
    });
  }

  var user = await authService.getUserById(requestedUserId);

  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  res.status(200).json({ user: user });
};
