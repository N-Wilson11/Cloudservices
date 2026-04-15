var express = require('express');

var registerController = require('../controllers/registerController');
var authenticate = require('../middleware/authenticate');
var authorizeRole = require('../middleware/authorizeRole');
var asyncHandler = require('../utils/asyncHandler');
var validateTargetId = require('../middleware/validateTargetId');

var router = express.Router();

router.get('/api/v1/register/health', registerController.health);
router.post('/api/v1/targets/:targetId/registrations', authenticate, authorizeRole('participant'), validateTargetId, asyncHandler(registerController.createRegistration));
router.get('/api/v1/me/registrations', authenticate, authorizeRole('participant'), asyncHandler(registerController.listMyRegistrations));
router.get('/api/v1/targets/:targetId/participants', authenticate, authorizeRole('target-owner'), validateTargetId, asyncHandler(registerController.listTargetParticipants));
router.delete('/api/v1/targets/:targetId/registrations/me', authenticate, authorizeRole('participant'), validateTargetId, asyncHandler(registerController.deleteMyRegistration));

module.exports = router;
