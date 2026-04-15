var mailService = require('./mailService');
var logger = require('../utils/logger');
var MailRegistration = require('../models/MailRegistration');

function buildScoreMap(scores) {
  var scoreMap = {};
  var rows = Array.isArray(scores) ? scores : [];

  for (var i = 0; i < rows.length; i += 1) {
    if (rows[i] && rows[i].userId) {
      scoreMap[rows[i].userId] = rows[i];
    }
  }

  return scoreMap;
}

exports.handleRegistrationCreatedEvent = async function handleRegistrationCreatedEvent(message) {
  if (!message || !message.userEmail || !message.targetId) {
    throw new Error('registration.created is missing required fields');
  }

  await MailRegistration.findOneAndUpdate({
    targetId: message.targetId,
    userId: message.userId
  }, {
    $set: {
      userEmail: message.userEmail,
      targetTitle: message.targetTitle || '',
      targetDescription: message.targetDescription || '',
      targetImageUrl: message.targetImageUrl || '',
      targetCity: message.targetCity || '',
      targetLocationDescription: message.targetLocationDescription || '',
      targetRadiusMeters: message.targetRadiusMeters || null,
      targetDeadline: message.targetDeadline ? new Date(message.targetDeadline) : null,
      status: 'active',
      registeredAt: new Date()
    }
  }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });

  await mailService.sendRegistrationEmail({
    userEmail: message.userEmail,
    targetId: message.targetId,
    targetTitle: message.targetTitle,
    targetDescription: message.targetDescription,
    targetImageUrl: message.targetImageUrl,
    targetCity: message.targetCity,
    targetLocationDescription: message.targetLocationDescription,
    targetRadiusMeters: message.targetRadiusMeters,
    targetDeadline: message.targetDeadline,
    registrationId: message.registrationId,
    userId: message.userId
  });

  logger.info('mail.event_processed', {
    routingKey: 'registration.created',
    targetId: message.targetId,
    userEmail: message.userEmail
  });
};

exports.handleWinnerCalculatedEvent = async function handleWinnerCalculatedEvent(message) {
  var scoreMap = buildScoreMap(message.scores);
  var registrations = await MailRegistration.find({
    targetId: message.targetId,
    status: 'active'
  });

  for (var i = 0; i < registrations.length; i += 1) {
    var participantScore = scoreMap[registrations[i].userId] || (registrations[i].submittedAt ? {
      similarityScore: registrations[i].similarityScore,
      submittedAt: registrations[i].submittedAt
    } : null);

    if (!participantScore) {
      continue;
    }

    await mailService.sendScoreEmail({
      to: registrations[i].userEmail,
      targetId: message.targetId,
      targetTitle: registrations[i].targetTitle,
      targetDescription: registrations[i].targetDescription,
      targetImageUrl: registrations[i].targetImageUrl,
      targetCity: registrations[i].targetCity,
      targetLocationDescription: registrations[i].targetLocationDescription,
      targetRadiusMeters: registrations[i].targetRadiusMeters,
      targetDeadline: registrations[i].targetDeadline ? registrations[i].targetDeadline.toISOString() : null,
      winnerSubmissionId: message.winnerSubmissionId,
      winnerUserId: message.winnerUserId,
      similarityScore: participantScore.similarityScore,
      finalScore: participantScore.finalScore,
      submittedAt: participantScore.submittedAt,
      isWinner: registrations[i].userId === message.winnerUserId
    });
  }

  if (message.ownerEmail) {
    await mailService.sendOwnerScoresEmail({
      to: message.ownerEmail,
      targetId: message.targetId,
      targetTitle: message.targetTitle,
      targetDeadline: message.deadlineAt,
      scores: message.scores
    });
  }

  logger.info('mail.event_processed', {
    routingKey: 'competition.winner-calculated.v1',
    targetId: message.targetId,
    winnerSubmissionId: message.winnerSubmissionId
  });
};

exports.handleDeadlineReminderEvent = async function handleDeadlineReminderEvent(message) {
  if (!message || !message.targetId || !message.deadlineAt) {
    throw new Error('clock.deadline-reminder.v1 is missing required fields');
  }

  var registrations = await MailRegistration.find({
    targetId: message.targetId,
    status: 'active',
    submittedAt: null
  });

  for (var i = 0; i < registrations.length; i += 1) {
    await mailService.sendDeadlineReminderEmail({
      to: registrations[i].userEmail,
      targetId: message.targetId,
      targetTitle: registrations[i].targetTitle,
      targetDescription: registrations[i].targetDescription,
      targetImageUrl: registrations[i].targetImageUrl,
      targetCity: registrations[i].targetCity,
      targetLocationDescription: registrations[i].targetLocationDescription,
      targetRadiusMeters: registrations[i].targetRadiusMeters,
      deadlineAt: message.deadlineAt
    });
  }

  logger.info('mail.event_processed', {
    routingKey: 'clock.deadline-reminder.v1',
    targetId: message.targetId,
    recipientCount: registrations.length
  });
};

exports.handleScoreCalculatedEvent = async function handleScoreCalculatedEvent(message) {
  if (!message || !message.targetId || !message.userId) {
    throw new Error('score.calculated.v1 is missing required fields');
  }

  await MailRegistration.findOneAndUpdate({
    targetId: message.targetId,
    userId: message.userId
  }, {
    $set: {
      userEmail: message.userEmail || '',
      submissionId: message.submissionId || null,
      similarityScore: message.similarityScore,
      submittedAt: message.calculatedAt ? new Date(message.calculatedAt) : new Date()
    }
  }, {
    upsert: true,
    setDefaultsOnInsert: true
  });

  logger.info('mail.event_processed', {
    routingKey: 'score.calculated.v1',
    targetId: message.targetId,
    userId: message.userId,
    submissionId: message.submissionId
  });
};

exports.handleTargetDeletedEvent = async function handleTargetDeletedEvent(message) {
  if (!message || !message.targetId) {
    throw new Error('target.deleted.v1 is missing required fields');
  }

  var result = await MailRegistration.deleteMany({
    targetId: message.targetId
  });

  logger.info('mail.event_processed', {
    routingKey: 'target.deleted.v1',
    targetId: message.targetId,
    deletedRegistrations: result.deletedCount || 0
  });
};

exports.handleDeadlineReachedEvent = async function handleDeadlineReachedEvent(message) {
  if (!message || !message.targetId || !message.deadlineAt) {
    throw new Error('clock.deadline-reached.v1 is missing required fields');
  }

  var registrations = await MailRegistration.find({
    targetId: message.targetId,
    status: 'active'
  });

  for (var i = 0; i < registrations.length; i += 1) {
    await mailService.sendDeadlineClosedEmail({
      to: registrations[i].userEmail,
      targetId: message.targetId,
      targetTitle: registrations[i].targetTitle,
      targetDescription: registrations[i].targetDescription,
      targetImageUrl: registrations[i].targetImageUrl,
      targetCity: registrations[i].targetCity,
      targetLocationDescription: registrations[i].targetLocationDescription,
      targetRadiusMeters: registrations[i].targetRadiusMeters,
      deadlineAt: message.deadlineAt
    });
  }

  logger.info('mail.event_processed', {
    routingKey: 'clock.deadline-reached.v1',
    targetId: message.targetId,
    recipientCount: registrations.length
  });
};
