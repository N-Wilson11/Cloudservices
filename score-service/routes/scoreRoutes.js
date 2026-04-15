var express = require('express');

var scoreController = require('../controllers/scoreController');
var authenticate = require('../middleware/authenticate');
var authorizeRole = require('../middleware/authorizeRole');
var asyncHandler = require('../utils/asyncHandler');
var validateImageUrl = require('../middleware/validateImageUrl');
var validateTargetId = require('../middleware/validateTargetId');

var router = express.Router();

router.get('/api/v1/score/health', scoreController.health);
router.post('/api/v1/targets/:targetId/submissions', authenticate, authorizeRole('participant'), validateTargetId, validateImageUrl, asyncHandler(scoreController.createSubmission));
router.get('/api/v1/targets/:targetId/score', authenticate, authorizeRole('participant'), validateTargetId, asyncHandler(scoreController.getMyScore));
router.get('/api/v1/targets/:targetId/scores', authenticate, authorizeRole('target-owner'), validateTargetId, asyncHandler(scoreController.getTargetScores));
router.get('/api/v1/targets/:targetId/winner', authenticate, authorizeRole('participant', 'target-owner'), validateTargetId, asyncHandler(scoreController.getTargetWinner));
router.delete('/api/v1/submissions/:submissionId', authenticate, authorizeRole('participant', 'target-owner'), asyncHandler(scoreController.deleteSubmission));

module.exports = router;
