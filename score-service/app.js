var express = require('express');

var scoreRoutes = require('./routes/scoreRoutes');
var errorHandler = require('./middleware/errorHandler');
var notFoundHandler = require('./middleware/notFoundHandler');
var logger = require('./utils/logger');

var app = express();

app.use(logger.requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(scoreRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
