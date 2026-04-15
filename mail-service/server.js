var app = require('./app');
var connectDatabase = require('./config/database');
var env = require('./config/env');
var logger = require('./utils/logger');
var rabbitmq = require('./utils/rabbitmq');
var mailEventService = require('./services/mailEventService');
var mongoose = require('mongoose');

var SUBSCRIBE_RETRY_DELAY_MS = 5000;

function subscribeToRegistrationCreated() {
  rabbitmq.subscribe(
    'mail-service.registration.created',
    'registration.created',
    mailEventService.handleRegistrationCreatedEvent
  ).then(function() {
    logger.info('rabbitmq.subscribed', {
      queue: 'mail-service.registration.created',
      routingKey: 'registration.created'
    });
  }).catch(function(error) {
    logger.error('rabbitmq.subscribe_failed', {
      queue: 'mail-service.registration.created',
      routingKey: 'registration.created',
      message: error.message,
      retryInMs: SUBSCRIBE_RETRY_DELAY_MS
    });

    setTimeout(subscribeToRegistrationCreated, SUBSCRIBE_RETRY_DELAY_MS);
  });
}

function subscribeToWinnerCalculated() {
  rabbitmq.subscribe(
    'mail-service.competition.winner-calculated.v1',
    'competition.winner-calculated.v1',
    mailEventService.handleWinnerCalculatedEvent
  ).then(function() {
    logger.info('rabbitmq.subscribed', {
      queue: 'mail-service.competition.winner-calculated.v1',
      routingKey: 'competition.winner-calculated.v1'
    });
  }).catch(function(error) {
    logger.error('rabbitmq.subscribe_failed', {
      queue: 'mail-service.competition.winner-calculated.v1',
      routingKey: 'competition.winner-calculated.v1',
      message: error.message,
      retryInMs: SUBSCRIBE_RETRY_DELAY_MS
    });

    setTimeout(subscribeToWinnerCalculated, SUBSCRIBE_RETRY_DELAY_MS);
  });
}

function subscribeToScoreCalculated() {
  rabbitmq.subscribe(
    'mail-service.score.calculated.v1',
    'score.calculated.v1',
    mailEventService.handleScoreCalculatedEvent
  ).then(function() {
    logger.info('rabbitmq.subscribed', {
      queue: 'mail-service.score.calculated.v1',
      routingKey: 'score.calculated.v1'
    });
  }).catch(function(error) {
    logger.error('rabbitmq.subscribe_failed', {
      queue: 'mail-service.score.calculated.v1',
      routingKey: 'score.calculated.v1',
      message: error.message,
      retryInMs: SUBSCRIBE_RETRY_DELAY_MS
    });

    setTimeout(subscribeToScoreCalculated, SUBSCRIBE_RETRY_DELAY_MS);
  });
}

function subscribeToDeadlineReminder() {
  rabbitmq.subscribe(
    'mail-service.clock.deadline-reminder.v1',
    'clock.deadline-reminder.v1',
    mailEventService.handleDeadlineReminderEvent
  ).then(function() {
    logger.info('rabbitmq.subscribed', {
      queue: 'mail-service.clock.deadline-reminder.v1',
      routingKey: 'clock.deadline-reminder.v1'
    });
  }).catch(function(error) {
    logger.error('rabbitmq.subscribe_failed', {
      queue: 'mail-service.clock.deadline-reminder.v1',
      routingKey: 'clock.deadline-reminder.v1',
      message: error.message,
      retryInMs: SUBSCRIBE_RETRY_DELAY_MS
    });

    setTimeout(subscribeToDeadlineReminder, SUBSCRIBE_RETRY_DELAY_MS);
  });
}

function subscribeToDeadlineReached() {
  rabbitmq.subscribe(
    'mail-service.clock.deadline-reached.v1',
    'clock.deadline-reached.v1',
    mailEventService.handleDeadlineReachedEvent
  ).then(function() {
    logger.info('rabbitmq.subscribed', {
      queue: 'mail-service.clock.deadline-reached.v1',
      routingKey: 'clock.deadline-reached.v1'
    });
  }).catch(function(error) {
    logger.error('rabbitmq.subscribe_failed', {
      queue: 'mail-service.clock.deadline-reached.v1',
      routingKey: 'clock.deadline-reached.v1',
      message: error.message,
      retryInMs: SUBSCRIBE_RETRY_DELAY_MS
    });

    setTimeout(subscribeToDeadlineReached, SUBSCRIBE_RETRY_DELAY_MS);
  });
}

function subscribeToTargetDeleted() {
  rabbitmq.subscribe(
    'mail-service.target-deleted.v1',
    'target.deleted.v1',
    mailEventService.handleTargetDeletedEvent
  ).then(function() {
    logger.info('rabbitmq.subscribed', {
      queue: 'mail-service.target-deleted.v1',
      routingKey: 'target.deleted.v1'
    });
  }).catch(function(error) {
    logger.error('rabbitmq.subscribe_failed', {
      queue: 'mail-service.target-deleted.v1',
      routingKey: 'target.deleted.v1',
      message: error.message,
      retryInMs: SUBSCRIBE_RETRY_DELAY_MS
    });

    setTimeout(subscribeToTargetDeleted, SUBSCRIBE_RETRY_DELAY_MS);
  });
}

connectDatabase(env.mongoUri).then(function() {
  rabbitmq.connect().then(function() {
    subscribeToRegistrationCreated();
    subscribeToScoreCalculated();
    subscribeToWinnerCalculated();
    subscribeToDeadlineReminder();
    subscribeToDeadlineReached();
    subscribeToTargetDeleted();
  }).catch(function() {
    // reconnect is handled in utils/rabbitmq
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
