var app = require('./app');
var connectDatabase = require('./config/database');
var env = require('./config/env');
var mongoose = require('mongoose');
var logger = require('./utils/logger');
var rabbitmq = require('./utils/rabbitmq');
var clockService = require('./services/clockService');
var SUBSCRIBE_RETRY_DELAY_MS = 5000;

function subscribeToTargetCreated() {
  rabbitmq.subscribe(
    'clock-service.target-created.v1',
    'target.created.v1',
    async function(message) {
      await clockService.handleTargetCreatedEvent(message);
    }
  ).then(function() {
    logger.info('rabbitmq.subscribed', {
      queue: 'clock-service.target-created.v1',
      routingKey: 'target.created.v1'
    });
  }).catch(function(error) {
    logger.error('rabbitmq.subscribe_failed', {
      message: error.message,
      retryInMs: SUBSCRIBE_RETRY_DELAY_MS
    });

    setTimeout(subscribeToTargetCreated, SUBSCRIBE_RETRY_DELAY_MS);
  });
}

function subscribeToTargetDeleted() {
  rabbitmq.subscribe(
    'clock-service.target-deleted.v1',
    'target.deleted.v1',
    async function(message) {
      await clockService.handleTargetDeletedEvent(message);
    }
  ).then(function() {
    logger.info('rabbitmq.subscribed', {
      queue: 'clock-service.target-deleted.v1',
      routingKey: 'target.deleted.v1'
    });
  }).catch(function(error) {
    logger.error('rabbitmq.subscribe_failed', {
      message: error.message,
      retryInMs: SUBSCRIBE_RETRY_DELAY_MS
    });

    setTimeout(subscribeToTargetDeleted, SUBSCRIBE_RETRY_DELAY_MS);
  });
}

connectDatabase(env.mongoUri).then(function() {
  rabbitmq.connect().catch(function() {
    // connect mislukt - reconnect wordt intern afgehandeld door rabbitmq util
  });

  subscribeToTargetCreated();
  subscribeToTargetDeleted();
  clockService.startPolling();

  var server = app.listen(env.port, function() {
    logger.info('server.started', { port: env.port });
  });

  function shutdown() {
    logger.info('server.stopping');
    server.close(function() {
      clockService.stopPolling();

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
