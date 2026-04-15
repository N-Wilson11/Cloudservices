var express = require('express');

var authController = require('../controllers/authController');
var authenticate = require('../middleware/authenticate');
var authorizeRole = require('../middleware/authorizeRole');
var asyncHandler = require('../utils/asyncHandler');
var validateAuthPayload = require('../middleware/validateAuthPayload');

var router = express.Router();

router.get('/health', authController.health);
router.post('/register', validateAuthPayload, asyncHandler(authController.register));
router.post('/login', validateAuthPayload, asyncHandler(authController.login));
router.get('/me', authenticate, authController.me);
router.get('/users', authenticate, authorizeRole('target-owner'), asyncHandler(authController.listUsers));
router.get('/users/:userId', authenticate, asyncHandler(authController.getUserById));

module.exports = router;
