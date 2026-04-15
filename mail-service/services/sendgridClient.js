var sendgrid = require('@sendgrid/mail');

var env = require('../config/env');
var HttpError = require('../utils/HttpError');

var isConfigured = false;

function normalizeFrom(value) {
  var from = String(value || '').trim();

  if (!from) {
    return from;
  }

  var match = from.match(/^(.*)<([^>]+)>$/);

  if (!match) {
    return from;
  }

  var name = String(match[1] || '').trim().replace(/^"|"$/g, '');
  var email = String(match[2] || '').trim();

  if (!email) {
    return from;
  }

  if (!name) {
    return email;
  }

  return {
    name: name,
    email: email
  };
}

function getClient() {
  if (!env.sendgridApiKey) {
    throw new HttpError(500, 'SendGrid API key is missing');
  }

  if (!isConfigured) {
    sendgrid.setApiKey(env.sendgridApiKey);
    isConfigured = true;
  }

  return sendgrid;
}

function getSendgridErrorMessage(error) {
  var statusCode = error && error.code ? error.code : null;
  var body = error && error.response ? error.response.body : null;
  var errors = body && Array.isArray(body.errors) ? body.errors : [];
  var reason = errors.length ? errors.map(function(item) {
    return item && item.message ? item.message : '';
  }).filter(Boolean).join('; ') : (error && error.message ? error.message : 'Unknown SendGrid error');

  if (statusCode) {
    return 'SendGrid request failed (' + statusCode + '): ' + reason;
  }

  return 'SendGrid request failed: ' + reason;
}

exports.sendEmail = async function sendEmail(payload) {
  var client = getClient();
  var response;

  try {
    response = await client.send({
      from: normalizeFrom(payload.from),
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html
    });
  } catch (error) {
    throw new HttpError(502, getSendgridErrorMessage(error));
  }

  var headers = response && response[0] && response[0].headers ? response[0].headers : null;

  return {
    id: headers && headers['x-message-id'] ? headers['x-message-id'] : null
  };
};
