var express = require('express');

var mailController = require('../controllers/mailController');
var authenticate = require('../middleware/authenticate');
var asyncHandler = require('../utils/asyncHandler');

var router = express.Router();

router.get('/health', mailController.health);
router.post('/test', authenticate, asyncHandler(mailController.sendTestMail));

module.exports = router;
