var env = require('../config/env');
var HttpError = require('../utils/HttpError');

function normalizeTarget(targetId, payload) {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(502, 'Target service returned an invalid response');
  }

  var source = payload.target || payload;

  return {
    targetId: source.targetId || source._id || targetId,
    ownerId: source.ownerId,
    ownerEmail: source.ownerEmail || '',
    title: source.title || '',
    description: source.description || '',
    imageUrl: source.imageUrl,
    city: source.city || '',
    locationDescription: source.locationDescription || '',
    radiusMeters: source.radiusMeters || null,
    deadlineAt: source.deadlineAt || source.deadline,
    createdAt: source.createdAt || null,
    status: source.status
  };
}

exports.getTargetById = async function getTargetById(targetId, authToken) {
  try {
    var response = await fetch(env.targetServiceUrl + '/' + encodeURIComponent(targetId), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + authToken
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (response.status === 401 || response.status === 403) {
      throw new HttpError(502, 'Target service rejected the internal authorization request');
    }

    if (!response.ok) {
      throw new HttpError(502, 'Target service request failed');
    }

    var payload = await response.json();
    return normalizeTarget(targetId, payload);
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    throw new HttpError(503, 'Target service is unavailable');
  }
};
