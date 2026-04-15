var registrationService = require('../services/registrationService');

exports.health = function(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'register-service'
  });
};

exports.createRegistration = async function(req, res) {
  var result = await registrationService.createRegistration({
    targetId: req.params.targetId,
    authToken: req.token,
    user: req.user
  });

  res.status(201).json(result);
};

exports.listMyRegistrations = async function(req, res) {
  var result = await registrationService.listRegistrationsForUser(req.user.userId);
  res.status(200).json(result);
};

exports.listTargetParticipants = async function(req, res) {
  var result = await registrationService.listParticipantsForTarget({
    targetId: req.params.targetId,
    authToken: req.token,
    user: req.user
  });

  res.status(200).json(result);
};

exports.deleteMyRegistration = async function(req, res) {
  var result = await registrationService.cancelRegistration({
    targetId: req.params.targetId,
    userId: req.user.userId
  });

  res.status(200).json(result);
};
