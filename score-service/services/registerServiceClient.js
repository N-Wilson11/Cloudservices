var env = require('../config/env');
var HttpError = require('../utils/HttpError');

exports.hasActiveRegistration = async function hasActiveRegistration(targetId, authToken) {
  try {
    var response = await fetch(env.registerServiceUrl + '/api/v1/me/registrations', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + authToken
      }
    });

    if (response.status === 401 || response.status === 403) {
      throw new HttpError(502, 'Register service rejected the internal authorization request');
    }

    if (!response.ok) {
      throw new HttpError(502, 'Register service request failed');
    }

    var payload = await response.json();
    var registrations = Array.isArray(payload.registrations) ? payload.registrations : [];

    return registrations.some(function(registration) {
      return registration.targetId === targetId && registration.status === 'active';
    });
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    throw new HttpError(503, 'Register service is unavailable');
  }
};
