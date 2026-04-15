var Submission = require('../models/Submission');
var Winner = require('../models/Winner');
var env = require('../config/env');
var imaggaClient = require('./imaggaClient');
var authServiceClient = require('./authServiceClient');
var registerServiceClient = require('./registerServiceClient');
var targetServiceClient = require('./targetServiceClient');
var HttpError = require('../utils/HttpError');
var rabbitmq = require('../utils/rabbitmq');
var logger = require('../utils/logger');

function normalizeImageUrl(value) {
  return String(value || '').trim();
}

function usernameFromEmail(email) {
  var normalized = String(email || '').trim();
  var atIndex = normalized.indexOf('@');

  if (atIndex <= 0) {
    return null;
  }

  return normalized.slice(0, atIndex);
}

function calculateTagSimilarityScore(targetTags, submissionTags) {
  var limit = 10;
  var submissionMap = {};
  var sharedConfidence = 0;
  var sharedCount = 0;
  var i;

  for (i = 0; i < Math.min(submissionTags.length, limit); i += 1) {
    submissionMap[submissionTags[i].tag] = submissionTags[i].confidence;
  }

  for (i = 0; i < Math.min(targetTags.length, limit); i += 1) {
    if (submissionMap[targetTags[i].tag] !== undefined) {
      sharedConfidence += Math.min(targetTags[i].confidence, submissionMap[targetTags[i].tag]);
      sharedCount += 1;
    }
  }

  if (!sharedCount) {
    return 0;
  }

  return Math.round(sharedConfidence / sharedCount);
}

async function calculateScore(targetUrl, submissionUrl) {
  var targetTags = await imaggaClient.fetchTagsForImage(targetUrl);
  var submissionTags = await imaggaClient.fetchTagsForImage(submissionUrl);

  return calculateTagSimilarityScore(targetTags, submissionTags);
}

function serializeSubmission(submission) {
  return {
    submissionId: submission._id,
    targetId: submission.targetId,
    userId: submission.userId,
    userEmail: submission.userEmail,
    imageUrl: submission.imageUrl,
    similarityScore: submission.similarityScore,
    submittedAt: submission.createdAt
  };
}

function publishScoreCalculated(submission, sourceSubmissionId) {
  var payload = {
    scoreId: String(submission._id),
    submissionId: sourceSubmissionId,
    targetId: submission.targetId,
    userId: submission.userId,
    userEmail: submission.userEmail,
    similarityScore: submission.similarityScore,
    calculatedAt: submission.updatedAt.toISOString()
  };
  
  logger.info('score.publishing', {
    routingKey: 'score.calculated.v1',
    scoreId: payload.scoreId,
    submissionId: sourceSubmissionId,
    similarityScore: payload.similarityScore
  });
  
  rabbitmq.publish('score.calculated.v1', payload);
}

function publishWinnerCalculated(message, winnerSubmission) {
  var calculatedAt = new Date();
  return {
    targetId: message.targetId,
    winnerSubmissionId: winnerSubmission ? String(winnerSubmission._id) : null,
    winnerUserId: winnerSubmission ? winnerSubmission.userId : null,
    winnerUserEmail: winnerSubmission ? winnerSubmission.userEmail : null,
    similarityScore: winnerSubmission ? winnerSubmission.similarityScore : null,
    submittedAt: winnerSubmission ? winnerSubmission.createdAt.toISOString() : null,
    deadlineAt: message.deadlineAt,
    calculatedAt: calculatedAt.toISOString()
  };
}

function calculateFinalScore(submission, target) {
  var similarityScore = Number(submission.similarityScore || 0);
  var submittedAt = new Date(submission.createdAt);
  var startedAt = target && target.createdAt ? new Date(target.createdAt) : null;
  var deadlineAt = target && target.deadlineAt ? new Date(target.deadlineAt) : null;

  if (!startedAt || !deadlineAt || Number.isNaN(startedAt.getTime()) || Number.isNaN(deadlineAt.getTime()) || deadlineAt <= startedAt) {
    return similarityScore;
  }

  var elapsedMs = Math.max(0, submittedAt.getTime() - startedAt.getTime());
  var durationMs = Math.max(1, deadlineAt.getTime() - startedAt.getTime());
  var timePenalty = Math.min(20, (elapsedMs / durationMs) * 20);

  return Math.max(0, Math.round((similarityScore - timePenalty) * 100) / 100);
}

function rankSubmissions(submissions, target) {
  return submissions.map(function(submission) {
    return {
      submission: submission,
      finalScore: calculateFinalScore(submission, target)
    };
  }).sort(function(a, b) {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }

    if (b.submission.similarityScore !== a.submission.similarityScore) {
      return b.submission.similarityScore - a.submission.similarityScore;
    }

    return new Date(a.submission.createdAt).getTime() - new Date(b.submission.createdAt).getTime();
  });
}

function serializeWinner(winner, winnerUserEmail) {
  var resolvedEmail = winnerUserEmail || winner.winnerUserEmail || null;

  return {
    targetId: winner.targetId,
    winnerSubmissionId: winner.winnerSubmissionId,
    winnerUserId: winner.winnerUserId,
    winnerUserEmail: resolvedEmail,
    username: usernameFromEmail(resolvedEmail) || winner.winnerUserId || null,
    similarityScore: winner.similarityScore,
    finalScore: winner.finalScore,
    submittedAt: winner.submittedAt ? winner.submittedAt.toISOString() : null,
    deadlineAt: winner.deadlineAt.toISOString(),
    calculatedAt: winner.calculatedAt.toISOString()
  };
}

async function loadOpenTarget(targetId, authToken) {
  var target = await targetServiceClient.getTargetById(targetId, authToken);

  if (!target) {
    throw new HttpError(404, 'Target not found');
  }

  var deadlineAt = new Date(target.deadlineAt);

  if (Number.isNaN(deadlineAt.getTime())) {
    throw new HttpError(502, 'Target service returned an invalid deadline');
  }

  if (target.status !== 'active' || deadlineAt.getTime() <= Date.now()) {
    throw new HttpError(409, 'Target is closed, no submissions accepted');
  }

  return target;
}

exports.createSubmission = async function createSubmission(input) {
  var target = await loadOpenTarget(input.targetId, input.authToken);
  var hasActiveRegistration = await registerServiceClient.hasActiveRegistration(input.targetId, input.authToken);
  var imageUrl = normalizeImageUrl(input.body.imageUrl);

  if (!hasActiveRegistration) {
    throw new HttpError(403, 'You must register for this target before creating a submission');
  }

  var targetImageUrl = normalizeImageUrl(target.imageUrl);

  if (imageUrl === targetImageUrl) {
    throw new HttpError(400, 'Submission must not use the exact same image URL as the target');
  }

  var similarityScore = await calculateScore(targetImageUrl, imageUrl);

  var submission = await Submission.create({
    targetId: target.targetId,
    userId: input.user.userId,
    userEmail: input.user.email || '',
    imageUrl: imageUrl,
    similarityScore: similarityScore
  });

  publishScoreCalculated(submission, String(submission._id));

  return {
    message: 'Submission created',
    submission: serializeSubmission(submission)
  };
};

exports.getBestScoreForUser = async function getBestScoreForUser(input) {
  var target = await targetServiceClient.getTargetById(input.targetId, input.authToken);

  if (!target) {
    throw new HttpError(404, 'Target not found');
  }

  var submission = await Submission.findOne({
    targetId: input.targetId,
    userId: input.user.userId
  }).sort({ similarityScore: -1, createdAt: 1 });

  if (!submission) {
    throw new HttpError(404, 'No submission found for this participant on this target');
  }

  return {
    targetId: input.targetId,
    userId: input.user.userId,
    score: {
      similarityScore: submission.similarityScore
    },
    submissionId: submission._id,
    submittedAt: submission.createdAt
  };
};

exports.getAllScoresForTarget = async function getAllScoresForTarget(input) {
  var target = await targetServiceClient.getTargetById(input.targetId, input.authToken);

  if (!target) {
    throw new HttpError(404, 'Target not found');
  }

  if (target.ownerId !== input.user.userId) {
    throw new HttpError(403, 'Only the target owner can view all scores');
  }

  var submissions = await Submission.find({ targetId: input.targetId });
  var rankedSubmissions = rankSubmissions(submissions, target);

  return {
    targetId: input.targetId,
    winnerSubmissionId: rankedSubmissions.length ? rankedSubmissions[0].submission._id : null,
    scores: rankedSubmissions.map(function(row, index) {
      var submission = row.submission;
      return {
        rank: index + 1,
        submissionId: submission._id,
        userId: submission.userId,
        userEmail: submission.userEmail,
        similarityScore: submission.similarityScore,
        finalScore: row.finalScore,
        submittedAt: submission.createdAt
      };
    })
  };
};

exports.deleteSubmission = async function deleteSubmission(input) {
  var submission = await Submission.findById(input.submissionId);

  if (!submission) {
    throw new HttpError(404, 'Submission not found');
  }

  if (submission.userId !== input.userId) {
    if (input.userRole !== 'target-owner') {
      throw new HttpError(403, 'You can only delete your own upload');
    }

    var target = await targetServiceClient.getTargetById(submission.targetId, input.authToken);

    if (!target) {
      throw new HttpError(404, 'Target not found');
    }

    if (target.ownerId !== input.userId) {
      throw new HttpError(403, 'Only the target owner can delete submissions on this target');
    }
  }

  await Submission.deleteOne({ _id: submission._id });

  return {
    message: 'Submission deleted',
    submissionId: submission._id
  };
};

exports.handleDeadlineReachedEvent = async function handleDeadlineReachedEvent(message) {
  if (!message || !message.targetId || !message.deadlineAt) {
    throw new Error('clock.deadline-reached.v1 missing required fields');
  }

  var target = null;

  try {
    target = await targetServiceClient.getTargetById(message.targetId, '');
  } catch (error) {
    logger.info('target.metadata_unavailable', {
      targetId: message.targetId,
      message: error.message
    });
  }

  var submissions = await Submission.find({
    targetId: message.targetId
  });
  var rankedSubmissions = rankSubmissions(submissions, target || {
    deadlineAt: message.deadlineAt
  });
  var winnerRow = rankedSubmissions.length ? rankedSubmissions[0] : null;
  var winnerSubmission = winnerRow ? winnerRow.submission : null;
  var payload = publishWinnerCalculated(message, winnerSubmission);
  payload.finalScore = winnerRow ? winnerRow.finalScore : null;
  payload.ownerId = message.ownerId || null;
  payload.ownerEmail = message.ownerEmail || null;

  if (target) {
    payload.ownerId = target.ownerId || null;
    payload.ownerEmail = target.ownerEmail || null;
    payload.targetTitle = target.title || '';
    payload.targetDescription = target.description || '';
    payload.targetImageUrl = target.imageUrl || '';
    payload.targetCity = target.city || '';
    payload.targetLocationDescription = target.locationDescription || '';
    payload.targetRadiusMeters = target.radiusMeters || null;
  }

  payload.scores = rankedSubmissions.map(function(row, index) {
    var submission = row.submission;
    return {
      rank: index + 1,
      submissionId: String(submission._id),
      userId: submission.userId,
      userEmail: submission.userEmail,
      similarityScore: submission.similarityScore,
      finalScore: row.finalScore,
      submittedAt: submission.createdAt.toISOString()
    };
  });

  var writeResult = await Winner.updateOne({
    targetId: message.targetId
  }, {
    $setOnInsert: {
      targetId: message.targetId,
      winnerSubmissionId: payload.winnerSubmissionId,
      winnerUserId: payload.winnerUserId,
      winnerUserEmail: payload.winnerUserEmail,
      similarityScore: payload.similarityScore,
      finalScore: payload.finalScore,
      submittedAt: payload.submittedAt ? new Date(payload.submittedAt) : null,
      deadlineAt: new Date(payload.deadlineAt),
      calculatedAt: new Date(payload.calculatedAt)
    }
  }, {
    upsert: true
  });

  if (writeResult.upsertedCount === 1) {
    logger.info('competition.publishing', {
      routingKey: 'competition.winner-calculated.v1',
      targetId: payload.targetId,
      winnerSubmissionId: payload.winnerSubmissionId
    });

    rabbitmq.publish('competition.winner-calculated.v1', payload);
  } else {
    logger.info('competition.publish_skipped', {
      routingKey: 'competition.winner-calculated.v1',
      targetId: payload.targetId
    });
  }

  return {
    targetId: message.targetId,
    winnerSubmissionId: winnerSubmission ? String(winnerSubmission._id) : null,
    published: writeResult.upsertedCount === 1
  };
};

exports.handleTargetDeletedEvent = async function handleTargetDeletedEvent(message) {
  if (!message || !message.targetId) {
    throw new Error('target.deleted.v1 missing required fields');
  }

  var submissionsResult = await Submission.deleteMany({ targetId: message.targetId });
  var winnersResult = await Winner.deleteMany({ targetId: message.targetId });

  logger.info('score.target_deleted', {
    routingKey: 'target.deleted.v1',
    targetId: message.targetId,
    deletedSubmissions: submissionsResult.deletedCount || 0,
    deletedWinners: winnersResult.deletedCount || 0
  });
};

exports.getWinnerForTarget = async function getWinnerForTarget(targetId, authToken) {
  var winner = await Winner.findOne({ targetId: targetId });

  if (!winner) {
    throw new HttpError(404, 'Winner has not been calculated yet');
  }

  var winnerUserEmail = winner.winnerUserEmail || null;

  if (!winnerUserEmail && winner.winnerUserId) {
    var user = await authServiceClient.getUserById(winner.winnerUserId, authToken);

    if (user && user.email) {
      winnerUserEmail = user.email;

      await Winner.updateOne({ _id: winner._id }, {
        $set: {
          winnerUserEmail: winnerUserEmail
        }
      });
    }
  }

  return {
    targetId: targetId,
    winner: serializeWinner(winner, winnerUserEmail)
  };
};
