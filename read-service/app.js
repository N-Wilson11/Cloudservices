var express = require('express');

var readService = require('./services/readService');
var logger = require('./utils/logger');

var app = express();

app.use(logger.requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/health', function(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'read-service'
  });
});

app.get('/contests/active', async function(req, res) {
  try {
    var result = await readService.listActiveContests(req.query);

    res.status(200).json(result);
  } catch (error) {
    var statusCode = error.statusCode || 502;

    logger.error('contests.active_failed', {
      message: error.message,
      statusCode: statusCode
    });

    res.status(statusCode).json({
      message: error.message || 'Failed to load active contests'
    });
  }
});

module.exports = app;
