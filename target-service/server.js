var app = require('./app');
var connectDatabase = require('./config/database');
var env = require('./config/env');
var mongoose = require('mongoose');
var logger = require('./utils/logger');
var rabbitmq = require('./utils/rabbitmq');

connectDatabase(env.mongoUri).then(function() {
  rabbitmq.connect().catch(function() {
    // connect mislukt - reconnect wordt intern afgehandeld door rabbitmq util
  });

  var server = app.listen(env.port, function() {
    logger.info('server.started', { port: env.port });
  });

  function shutdown() {
    logger.info('server.stopping');
    server.close(function() {
      rabbitmq.close().then(function() {
        mongoose.connection.close(false).then(function() {
          logger.info('server.stopped');
          process.exit(0);
        }).catch(function() {
          logger.error('server.stop_failed');
          process.exit(1);
        });
      }).catch(function(error) {
        logger.error('rabbitmq.close_failed', { message: error.message });
        mongoose.connection.close(false).then(function() {
          process.exit(1);
        });
      });
    });
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}).catch(function(error) {
  logger.error('server.start_failed', {
    message: error.message
  });
  process.exit(1);
});
