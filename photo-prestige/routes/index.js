var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Photo Prestige' });
});

router.get('/auth-demo', function(req, res, next) {
  res.render('auth-demo', { title: 'Auth' });
});

router.get('/register-demo', function(req, res, next) {
  res.render('register-demo', { title: 'Register' });
});

router.get('/score-demo', function(req, res, next) {
  res.render('score-demo', { title: 'Score' });
});

router.get('/target-demo', function(req, res, next) {
  res.render('target-demo', { title: 'Target' });
});

router.get('/read-demo', function(req, res, next) {
  res.render('read-demo', { title: 'Read' });
});

router.get('/clock-demo', function(req, res, next) {
  res.render('clock-demo', { title: 'Clock' });
});

router.get('/mail-demo', function(req, res, next) {
  res.render('mail-demo', { title: 'Mail' });
});

router.get('/api-docs', function(req, res, next) {
  res.redirect('/swagger.html');
});

module.exports = router;
