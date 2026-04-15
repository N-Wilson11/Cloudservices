var app = require('./app');
var env = require('./config/env');
var logger = require('./utils/logger');

var server = app.listen(env.port, function() {
  logger.info('server.started', { port: env.port });
});

function shutdown() {
  logger.info('server.stopping');
  server.close(function() {
    logger.info('server.stopped');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);