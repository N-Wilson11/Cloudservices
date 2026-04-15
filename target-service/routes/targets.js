var express = require('express');

var Target = require('../models/Target');
var Vote = require('../models/Vote');
var authenticate = require('../middleware/authenticate');
var authorizeRole = require('../middleware/authorizeRole');
var rabbitmq = require('../utils/rabbitmq');

var router = express.Router();

async function closeExpiredTargets() {
  await Target.updateMany({
    status: 'active',
    deadlineAt: { $lt: new Date() }
  }, {
    $set: { status: 'closed' }
  });
}

function parseCoordinates(latValue, lngValue) {
  var lat = Number(latValue);
  var lng = Number(lngValue);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return {
    lat: lat,
    lng: lng
  };
}

async function buildVoteSummary(targetId) {
  var thumbsUp = await Vote.countDocuments({
    targetId: String(targetId),
    vote: 'up'
  });
  var thumbsDown = await Vote.countDocuments({
    targetId: String(targetId),
    vote: 'down'
  });

  return {
    targetId: String(targetId),
    thumbsUp: thumbsUp,
    thumbsDown: thumbsDown
  };
}

router.get('/', async function(req, res) {
  try {
    await closeExpiredTargets();

    var filter = {};

    if (req.query.city) {
      filter.city = new RegExp(req.query.city, 'i');
    }

    if (req.query.ownerId) {
      filter.ownerId = req.query.ownerId;
    }

    if (req.query.active === 'true') {
      filter.status = 'active';
    }

    if (req.query.active === 'false') {
      filter.status = 'closed';
    }

    var query = Target.find(filter).sort({ createdAt: -1 });

    if (req.query.lat && req.query.lng) {
      var point = parseCoordinates(req.query.lat, req.query.lng);

      if (!point) {
        return res.status(400).json({
          message: 'Invalid coordinates in query'
        });
      }

      var radiusMeters = req.query.radiusMeters ? Number(req.query.radiusMeters) : null;
      var radiusKm = req.query.radiusKm ? Number(req.query.radiusKm) : null;

      if (radiusMeters && Number.isFinite(radiusMeters)) {
        query.where('location').near({
          center: {
            type: 'Point',
            coordinates: [point.lng, point.lat]
          },
          maxDistance: radiusMeters,
          spherical: true
        });
      } else if (radiusKm && Number.isFinite(radiusKm)) {
        query.where('location').near({
          center: {
            type: 'Point',
            coordinates: [point.lng, point.lat]
          },
          maxDistance: radiusKm * 1000,
          spherical: true
        });
      }
    }

    var limit = req.query.limit ? Number(req.query.limit) : 50;
    var skip = req.query.skip ? Number(req.query.skip) : 0;

    if (Number.isFinite(limit) && limit > 0) {
      query.limit(Math.min(limit, 200));
    }

    if (Number.isFinite(skip) && skip >= 0) {
      query.skip(skip);
    }

    var targets = await query.exec();

    res.status(200).json({
      count: targets.length,
      targets: targets
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to list targets',
      error: error.message
    });
  }
});

router.post('/', authenticate, authorizeRole('target-owner'), async function(req, res) {
  try {
    var requiredFields = ['title', 'imageUrl', 'lat', 'lng', 'deadlineAt'];

    for (var i = 0; i < requiredFields.length; i += 1) {
      if (req.body[requiredFields[i]] === undefined || req.body[requiredFields[i]] === null || req.body[requiredFields[i]] === '') {
        return res.status(400).json({
          message: 'Missing required field: ' + requiredFields[i]
        });
      }
    }

    var point = parseCoordinates(req.body.lat, req.body.lng);

    if (!point) {
      return res.status(400).json({
        message: 'Invalid coordinates'
      });
    }

    var deadlineAt = new Date(req.body.deadlineAt);

    if (Number.isNaN(deadlineAt.getTime()) || deadlineAt <= new Date()) {
      return res.status(400).json({
        message: 'deadlineAt must be a valid future date'
      });
    }

    var radiusMeters = req.body.radiusMeters ? Number(req.body.radiusMeters) : 250;

    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
      return res.status(400).json({
        message: 'radiusMeters must be a positive number'
      });
    }

    var target = await Target.create({
      title: req.body.title,
      description: req.body.description || '',
      imageUrl: req.body.imageUrl,
      locationDescription: req.body.locationDescription || '',
      city: req.body.city || '',
      location: {
        type: 'Point',
        coordinates: [point.lng, point.lat]
      },
      radiusMeters: radiusMeters,
      deadlineAt: deadlineAt,
      status: 'active',
      ownerId: req.auth.userId,
      ownerEmail: req.auth.email || ''
    });

    rabbitmq.publish('target.created.v1', {
      targetId: String(target._id),
      ownerId: target.ownerId,
      ownerEmail: target.ownerEmail,
      imageUrl: target.imageUrl,
      deadlineAt: target.deadlineAt.toISOString(),
      createdAt: target.createdAt.toISOString()
    });

    res.status(201).json({
      message: 'Target created',
      target: target
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to create target',
      error: error.message
    });
  }
});

router.get('/:targetId', async function(req, res) {
  try {
    await closeExpiredTargets();

    var target = await Target.findById(req.params.targetId);

    if (!target) {
      return res.status(404).json({
        message: 'Target not found'
      });
    }

    res.status(200).json({
      target: target,
      votes: await buildVoteSummary(target._id)
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to load target',
      error: error.message
    });
  }
});

router.get('/:targetId/votes', async function(req, res) {
  try {
    var target = await Target.findById(req.params.targetId);

    if (!target) {
      return res.status(404).json({
        message: 'Target not found'
      });
    }

    res.status(200).json(await buildVoteSummary(target._id));
  } catch (error) {
    res.status(400).json({
      message: 'Failed to load votes',
      error: error.message
    });
  }
});

router.post('/:targetId/vote', authenticate, authorizeRole('participant'), async function(req, res) {
  try {
    var vote = String(req.body.vote || '').trim().toLowerCase();

    if (vote !== 'up' && vote !== 'down') {
      return res.status(400).json({
        message: 'vote must be up or down'
      });
    }

    var target = await Target.findById(req.params.targetId);

    if (!target) {
      return res.status(404).json({
        message: 'Target not found'
      });
    }

    await Vote.findOneAndUpdate({
      targetId: String(target._id),
      userId: req.auth.userId
    }, {
      $set: {
        vote: vote
      }
    }, {
      upsert: true,
      setDefaultsOnInsert: true
    });

    res.status(200).json({
      message: 'Vote saved',
      vote: vote,
      votes: await buildVoteSummary(target._id)
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to save vote',
      error: error.message
    });
  }
});

router.patch('/:targetId/deadline', authenticate, authorizeRole('target-owner'), async function(req, res) {
  try {
    var target = await Target.findById(req.params.targetId);

    if (!target) {
      return res.status(404).json({
        message: 'Target not found'
      });
    }

    if (target.ownerId !== req.auth.userId) {
      return res.status(403).json({
        message: 'Only the owner can change the deadline'
      });
    }

    var deadlineAt = new Date(req.body.deadlineAt);

    if (Number.isNaN(deadlineAt.getTime()) || deadlineAt <= new Date()) {
      return res.status(400).json({
        message: 'deadlineAt must be a valid future date'
      });
    }

    target.deadlineAt = deadlineAt;
    target.status = 'active';
    await target.save();

    res.status(200).json({
      message: 'Deadline updated',
      target: target
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to update deadline',
      error: error.message
    });
  }
});

router.delete('/:targetId', authenticate, authorizeRole('target-owner'), async function(req, res) {
  try {
    var target = await Target.findById(req.params.targetId);

    if (!target) {
      return res.status(404).json({
        message: 'Target not found'
      });
    }

    if (target.ownerId !== req.auth.userId) {
      return res.status(403).json({
        message: 'Only the owner can delete this target'
      });
    }

    var targetId = String(target._id);

    await Vote.deleteMany({ targetId: targetId });
    await Target.deleteOne({ _id: target._id });

    rabbitmq.publish('target.deleted.v1', {
      targetId: targetId,
      ownerId: target.ownerId,
      ownerEmail: target.ownerEmail,
      deletedAt: new Date().toISOString()
    });

    res.status(200).json({
      message: 'Target deleted',
      targetId: targetId
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to delete target',
      error: error.message
    });
  }
});

router.post('/:targetId/submissions', authenticate, authorizeRole('participant', 'target-owner'), async function(req, res) {
  try {
    await closeExpiredTargets();

    var target = await Target.findById(req.params.targetId);

    if (!target) {
      return res.status(404).json({
        message: 'Target not found'
      });
    }

    if (target.status !== 'active') {
      return res.status(400).json({
        message: 'Target is closed, no submissions accepted'
      });
    }

    var imageUrl = normalizeImageUrl(req.body.imageUrl);

    if (!imageUrl) {
      return res.status(400).json({
        message: 'imageUrl is required'
      });
    }

    if (imageUrl === normalizeImageUrl(target.imageUrl)) {
      return res.status(400).json({
        message: 'Submission must be a similar photo, not the exact same image URL'
      });
    }

    var similarityScore = calculateSimilarityScore(target.imageUrl, imageUrl);
    var totalScore = Math.round(similarityScore * 0.8 + 20);

    if (totalScore > 100) {
      totalScore = 100;
    }

    var submission = await Submission.create({
      targetId: target._id,
      userId: req.auth.userId,
      userEmail: req.auth.email || '',
      imageUrl: imageUrl,
      similarityScore: similarityScore,
      totalScore: totalScore
    });

    rabbitmq.publish('submission.uploaded.v1', {
      submissionId: String(submission._id),
      targetId: String(target._id),
      userId: submission.userId,
      userEmail: submission.userEmail,
      imageUrl: submission.imageUrl,
      targetImageUrl: target.imageUrl,
      submittedAt: submission.createdAt.toISOString()
    });

    res.status(201).json({
      message: 'Submission created',
      submission: submission
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to create submission',
      error: error.message
    });
  }
});

router.get('/:targetId/score', authenticate, async function(req, res) {
  try {
    var target = await Target.findById(req.params.targetId);

    if (!target) {
      return res.status(404).json({
        message: 'Target not found'
      });
    }

    var submission = await Submission.findOne({
      targetId: target._id,
      userId: req.auth.userId
    }).sort({ totalScore: -1, createdAt: 1 });

    if (!submission) {
      return res.status(404).json({
        message: 'No submission found for this participant on this target'
      });
    }

    res.status(200).json({
      targetId: target._id,
      userId: req.auth.userId,
      score: {
        similarityScore: submission.similarityScore,
        totalScore: submission.totalScore
      },
      submissionId: submission._id,
      submittedAt: submission.createdAt
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to load score',
      error: error.message
    });
  }
});

router.delete('/submissions/:submissionId', authenticate, async function(req, res) {
  try {
    var submission = await Submission.findById(req.params.submissionId);

    if (!submission) {
      return res.status(404).json({
        message: 'Submission not found'
      });
    }

    if (submission.userId !== req.auth.userId) {
      return res.status(403).json({
        message: 'You can only delete your own upload'
      });
    }

    await Submission.deleteOne({ _id: submission._id });

    res.status(200).json({
      message: 'Submission deleted',
      submissionId: submission._id
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to delete submission',
      error: error.message
    });
  }
});

module.exports = router;
