var env = require('../config/env');

function normalizeUser(payload, userId) {
  var source = payload && payload.user ? payload.user : payload;

  if (!source || typeof source !== 'object') {
    return null;
  }

  return {
    id: source.id || source._id || userId,
    email: source.email || null,
    role: source.role || null,
    createdAt: source.createdAt || null
  };
}

exports.getUserById = async function getUserById(userId, authToken) {
  if (!userId || !authToken) {
    return null;
  }

  try {
    var response = await fetch(env.authServiceUrl + '/users/' + encodeURIComponent(userId), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + authToken
      }
    });

    if (response.status === 404 || response.status === 403 || response.status === 401) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    var payload = await response.json();
    return normalizeUser(payload, userId);
  } catch (error) {
    return null;
  }
};
