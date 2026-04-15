var env = require('../config/env');
var HttpError = require('../utils/HttpError');

function createBasicAuthHeader() {
  var token = Buffer.from(env.imaggaApiKey + ':' + env.imaggaApiSecret).toString('base64');
  return 'Basic ' + token;
}

function buildUpstreamError(response, payload) {
  var upstreamMessage = payload && payload.status && payload.status.text
    ? payload.status.text
    : 'Imagga request failed';

  if (response.status === 400 && upstreamMessage === "Couldn't download image") {
    return new HttpError(400, 'Image URL must be a direct public image URL');
  }

  if (response.status === 401 || response.status === 403) {
    return new HttpError(502, 'Imagga credentials were rejected');
  }

  return new HttpError(502, 'Imagga request failed: ' + upstreamMessage);
}

exports.fetchTagsForImage = async function fetchTagsForImage(imageUrl) {
  if (!env.imaggaApiKey || !env.imaggaApiSecret) {
    throw new HttpError(503, 'Imagga credentials are missing');
  }

  try {
    var response = await fetch(
      env.imaggaApiBaseUrl + '/tags?image_url=' + encodeURIComponent(imageUrl),
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': createBasicAuthHeader()
        }
      }
    );

    if (!response.ok) {
      throw buildUpstreamError(response, await response.json().catch(function() {
        return null;
      }));
    }

    var payload = await response.json();

    if (!payload || !payload.result || !Array.isArray(payload.result.tags)) {
      throw new HttpError(502, 'Imagga returned an invalid response');
    }

    return payload.result.tags.map(function(tagEntry) {
      return {
        tag: tagEntry.tag && tagEntry.tag.en ? tagEntry.tag.en : '',
        confidence: Number(tagEntry.confidence) || 0
      };
    }).filter(function(tagEntry) {
      return tagEntry.tag;
    });
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    throw new HttpError(503, 'Imagga is unavailable');
  }
};
