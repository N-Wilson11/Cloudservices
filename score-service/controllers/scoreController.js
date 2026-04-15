var scoreService = require('../services/scoreService');

exports.health = function(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'score-service'
  });
};

exports.createSubmission = async function(req, res) {
  var result = await scoreService.createSubmission({
    targetId: req.params.targetId,
    authToken: req.token,
    user: req.user,
    body: req.body
  });

  res.status(201).json(result);
};

exports.getMyScore = async function(req, res) {
  var result = await scoreService.getBestScoreForUser({
    targetId: req.params.targetId,
    authToken: req.token,
    user: req.user
  });

  res.status(200).json(result);
};

exports.getTargetScores = async function(req, res) {
  var result = await scoreService.getAllScoresForTarget({
    targetId: req.params.targetId,
    authToken: req.token,
    user: req.user
  });

  res.status(200).json(result);
};

exports.getTargetWinner = async function(req, res) {
  var result = await scoreService.getWinnerForTarget(req.params.targetId, req.token);

  res.status(200).json(result);
};

exports.deleteSubmission = async function(req, res) {
  var result = await scoreService.deleteSubmission({
    submissionId: req.params.submissionId,
    userId: req.user.userId,
    userRole: req.user.role,
    authToken: req.token
  });

  res.status(200).json(result);
};
