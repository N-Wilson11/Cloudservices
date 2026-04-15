var env = require('../config/env');
var sendgridClient = require('./sendgridClient');
var HttpError = require('../utils/HttpError');
var logger = require('../utils/logger');
var buildRegistrationEmail = require('../templates/registrationEmail');
var buildReminderEmail = require('../templates/reminderEmail');
var buildDeadlineClosedEmail = require('../templates/deadlineClosedEmail');
var buildScoreEmail = require('../templates/scoreEmail');
var buildOwnerScoresEmail = require('../templates/ownerScoresEmail');

async function deliverMail(options) {
  var to = String(options.to || '').trim();

  if (!to) {
    throw new HttpError(400, 'A recipient email address is required');
  }

  var response = await sendgridClient.sendEmail({
    from: env.mailFrom,
    to: to,
    subject: options.subject,
    text: options.text,
    html: options.html
  });

  logger.info('mail.sent', {
    to: to,
    subject: options.subject
  });

  return {
    to: to,
    subject: options.subject,
    provider: 'sendgrid',
    id: response ? response.id : null
  };
}

exports.sendTestMail = async function sendTestMail(input) {
  return deliverMail({
    to: input.to || input.user.email,
    subject: input.subject || 'Photo Prestige test email',
    text: input.text || 'This is a test email from the mail-service.',
    html: input.html || '<p>This is a test email from the mail-service.</p>'
  });
};

exports.sendRegistrationEmail = async function sendRegistrationEmail(payload) {
  var message = buildRegistrationEmail(payload);

  return deliverMail({
    to: payload.userEmail,
    subject: message.subject,
    text: message.text,
    html: message.html
  });
};

exports.sendScoreEmail = async function sendScoreEmail(payload) {
  var message = buildScoreEmail(payload);

  return deliverMail({
    to: payload.to,
    subject: message.subject,
    text: message.text,
    html: message.html
  });
};

exports.sendDeadlineReminderEmail = async function sendDeadlineReminderEmail(payload) {
  var message = buildReminderEmail(payload);

  return deliverMail({
    to: payload.to,
    subject: message.subject,
    text: message.text,
    html: message.html
  });
};

exports.sendDeadlineClosedEmail = async function sendDeadlineClosedEmail(payload) {
  var message = buildDeadlineClosedEmail(payload);

  return deliverMail({
    to: payload.to,
    subject: message.subject,
    text: message.text,
    html: message.html
  });
};

exports.sendOwnerScoresEmail = async function sendOwnerScoresEmail(payload) {
  var message = buildOwnerScoresEmail(payload);

  return deliverMail({
    to: payload.to,
    subject: message.subject,
    text: message.text,
    html: message.html
  });
};
