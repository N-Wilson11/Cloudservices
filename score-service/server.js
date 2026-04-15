var app = require('./app');
var connectDatabase = require('./config/database');
var env = require('./config/env');
var mongoose = require('mongoose');
var logger = require('./utils/logger');
var rabbitmq = require('./utils/rabbitmq');
var scoreService = require('./services/scoreService');

function subscribeToDeadlineReached() {
  rabbitmq.subscribe(
    'score-service.clock.deadline-reached.v1',
    'clock.deadline-reached.v1',
    scoreService.handleDeadlineReachedEvent
  ).then(function() {
    logger.info('rabbitmq.subscribed', {
      queue: 'score-service.clock.deadline-reached.v1',
      routingKey: 'clock.deadline-reached.v1'
    });
  }).catch(function(error) {
    logger.error('rabbitmq.subscribe_failed', {
      queue: 'score-service.clock.deadline-reached.v1',
      routingKey: 'clock.deadline-reached.v1',
      message: error.message
    });

    setTimeout(subscribeToDeadlineReached, 5000);
  });
}

function subscribeToTargetDeleted() {
  rabbitmq.subscribe(
    'score-service.target-deleted.v1',
    'target.deleted.v1',
    scoreService.handleTargetDeletedEvent
  ).then(function() {
    logger.info('rabbitmq.subscribed', {
      queue: 'score-service.target-deleted.v1',
      routingKey: 'target.deleted.v1'
    });
  }).catch(function(error) {
    logger.error('rabbitmq.subscribe_failed', {
      queue: 'score-service.target-deleted.v1',
      routingKey: 'target.deleted.v1',
      message: error.message
    });

    setTimeout(subscribeToTargetDeleted, 5000);
  });
}

connectDatabase(env.mongoUri).then(function() {
  rabbitmq.connect().catch(function() {
    // reconnect is handled in utils/rabbitmq
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
