var app = require('./app');
var connectDatabase = require('./config/database');
var env = require('./config/env');
var mongoose = require('mongoose');
var logger = require('./utils/logger');
var rabbitmq = require('./utils/rabbitmq');
var clockEventService = require('./services/clockEventService');
var SUBSCRIBE_RETRY_DELAY_MS = 5000;

function subscribeToDeadlineReached() {
  rabbitmq.subscribe(
    'register-service.clock.deadline-reached.v1',
    'clock.deadline-reached.v1',
    function(message) {
      return clockEventService.markTargetClosed(message).then(function() {
        logger.info('rabbitmq.received', {
          routingKey: 'clock.deadline-reached.v1',
          targetId: message.targetId,
          deadlineAt: message.deadlineAt,
          reachedAt: message.reachedAt
        });
      });
    }
  ).then(function() {
    logger.info('rabbitmq.subscribed', {
      queue: 'register-service.clock.deadline-reached.v1',
      routingKey: 'clock.deadline-reached.v1'
    });
  }).catch(function(error) {
    logger.error('rabbitmq.subscribe_failed', {
      queue: 'register-service.clock.deadline-reached.v1',
      routingKey: 'clock.deadline-reached.v1',
      message: error.message,
      retryInMs: SUBSCRIBE_RETRY_DELAY_MS
    });

    setTimeout(subscribeToDeadlineReached, SUBSCRIBE_RETRY_DELAY_MS);
  });
}

function subscribeToTargetDeleted() {
  rabbitmq.subscribe(
    'register-service.target-deleted.v1',
    'target.deleted.v1',
    function(message) {
      return clockEventService.markTargetDeleted(message).then(function() {
        logger.info('rabbitmq.received', {
          routingKey: 'target.deleted.v1',
          targetId: message.targetId
        });
      });
    }
  ).then(function() {
    logger.info('rabbitmq.subscribed', {
      queue: 'register-service.target-deleted.v1',
      routingKey: 'target.deleted.v1'
    });
  }).catch(function(error) {
    logger.error('rabbitmq.subscribe_failed', {
      queue: 'register-service.target-deleted.v1',
      routingKey: 'target.deleted.v1',
      message: error.message,
      retryInMs: SUBSCRIBE_RETRY_DELAY_MS
    });

    setTimeout(subscribeToTargetDeleted, SUBSCRIBE_RETRY_DELAY_MS);
  });
}

connectDatabase(env.mongoUri).then(function() {
  rabbitmq.connect().catch(function() {
    // connect mislukt – reconnect wordt intern afgehandeld door rabbitmq util
  });

  subscribeToDeadlineReached();
  subscribeToTargetDeleted();

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
