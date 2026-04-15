var express = require('express');

var targetsRouter = require('./routes/targets');
var logger = require('./utils/logger');

var app = express();

app.use(logger.requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/health', function(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'target-service'
  });
});

app.use('/', targetsRouter);

module.exports = app;
