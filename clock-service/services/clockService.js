var Clock = require('../models/Clock');
var env = require('../config/env');
var rabbitmq = require('../utils/rabbitmq');
var logger = require('../utils/logger');

var pollTimer = null;
var pollInProgress = false;

function publishDeadlineReached(clock) {
  rabbitmq.publish('clock.deadline-reached.v1', {
    clockId: String(clock._id),
    targetId: clock.targetId,
    ownerId: clock.ownerId,
    ownerEmail: clock.ownerEmail,
    deadlineAt: clock.deadlineAt.toISOString(),
    reachedAt: clock.reachedAt.toISOString()
  });
}

function publishDeadlineReminder(clock) {
  rabbitmq.publish('clock.deadline-reminder.v1', {
    clockId: String(clock._id),
    targetId: clock.targetId,
    ownerId: clock.ownerId,
    ownerEmail: clock.ownerEmail,
    deadlineAt: clock.deadlineAt.toISOString(),
    reminderAt: new Date().toISOString()
  });
}

async function markDeadlineReached() {
  var reachedAt = new Date();

  var clock = await Clock.findOneAndUpdate({
    status: 'running',
    deadlineAt: { $lte: reachedAt }
  }, {
    $set: {
      status: 'reached',
      reachedAt: reachedAt
    }
  }, {
    new: true
  });

  if (!clock) {
    return false;
  }

  logger.info('clock.deadline_reached.v1', {
    targetId: clock.targetId,
    deadlineAt: clock.deadlineAt.toISOString(),
    reachedAt: reachedAt.toISOString()
  });

  publishDeadlineReached(clock);
  return true;
}

async function markReminderSent() {
  var now = new Date();
  var reminderThreshold = new Date(now.getTime() + env.deadlineReminderMinutes * 60 * 1000);
  var reminderIntervalStartedAt = new Date(now.getTime() - env.deadlineReminderIntervalMinutes * 60 * 1000);

  var clock = await Clock.findOneAndUpdate({
    status: 'running',
    $or: [
      { reminderSentAt: null },
      { reminderSentAt: { $lte: reminderIntervalStartedAt } }
    ],
    deadlineAt: {
      $gt: now,
      $lte: reminderThreshold
    }
  }, {
    $set: {
      reminderSentAt: now
    }
  }, {
    new: true,
    sort: { deadlineAt: 1 }
  });

  if (!clock) {
    return false;
  }

  publishDeadlineReminder(clock);

  logger.info('clock.deadline_reminder.v1', {
    targetId: clock.targetId,
    deadlineAt: new Date(clock.deadlineAt).toISOString()
  });

  return true;
}

async function processDueClocks() {
  if (pollInProgress || !rabbitmq.isReady()) {
    return;
  }

  pollInProgress = true;

  try {
    while (await markReminderSent()) {
      // Keep draining due reminders in the current poll cycle.
    }

    while (await markDeadlineReached()) {
      // Keep draining due deadlines in the current poll cycle.
    }
  } finally {
    pollInProgress = false;
  }
}

exports.handleTargetCreatedEvent = async function handleTargetCreatedEvent(message) {
  if (!message || !message.targetId || !message.deadlineAt || !message.ownerId) {
    throw new Error('target.created.v1 missing required fields');
  }

  var deadlineAt = new Date(message.deadlineAt);

  if (Number.isNaN(deadlineAt.getTime())) {
    throw new Error('target.created.v1 has invalid deadlineAt');
  }

  var clock = await Clock.findOneAndUpdate({
    targetId: message.targetId
  }, {
    $set: {
      ownerId: message.ownerId,
      ownerEmail: message.ownerEmail || '',
      deadlineAt: deadlineAt,
      status: 'running',
      reminderSentAt: null,
      reachedAt: null
    },
    $setOnInsert: {
      startedAt: new Date()
    }
  }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });

  logger.info('clock.saved', {
    targetId: clock.targetId,
    deadlineAt: clock.deadlineAt.toISOString(),
    reminderSentAt: clock.reminderSentAt ? clock.reminderSentAt.toISOString() : null
  });
};

exports.handleTargetDeletedEvent = async function handleTargetDeletedEvent(message) {
  if (!message || !message.targetId) {
    throw new Error('target.deleted.v1 missing required fields');
  }

  var result = await Clock.deleteOne({
    targetId: message.targetId
  });

  logger.info('clock.deleted', {
    routingKey: 'target.deleted.v1',
    targetId: message.targetId,
    deletedClocks: result.deletedCount || 0
  });
};

exports.startPolling = function startPolling() {
  if (pollTimer) {
    return;
  }

  processDueClocks().catch(function(error) {
    logger.error('clock.poll_failed', { message: error.message });
  });

  pollTimer = setInterval(function() {
    processDueClocks().catch(function(error) {
      logger.error('clock.poll_failed', { message: error.message });
    });
  }, env.pollIntervalMs);

  logger.info('clock.polling_started', {
    pollIntervalMs: env.pollIntervalMs
  });
};

exports.stopPolling = function stopPolling() {
  if (!pollTimer) {
    return;
  }

  clearInterval(pollTimer);
  pollTimer = null;

  logger.info('clock.polling_stopped');
};
