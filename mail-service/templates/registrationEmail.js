var formatDateTime = require('../utils/formatDateTime');

module.exports = function buildRegistrationEmail(payload) {
  var title = payload.targetTitle || 'Untitled target';
  var imageLink = payload.targetImageUrl ? 'View target image: ' + payload.targetImageUrl : null;
  var deadline = formatDateTime(payload.targetDeadline);
  var subject = 'Registration confirmed: ' + title;
  var text = [
    'Your registration has been received.',
    '',
    'Title: ' + title,
    'Target ID: ' + payload.targetId,
    'Deadline: ' + deadline,
    'City: ' + (payload.targetCity || 'unknown'),
    'Location: ' + (payload.targetLocationDescription || 'unknown'),
    'Radius: ' + (payload.targetRadiusMeters ? payload.targetRadiusMeters + ' meters' : 'unknown'),
    imageLink,
    '',
    'Registration ID: ' + payload.registrationId
  ].filter(Boolean).join('\n');
  var html = [
    '<p>Your registration has been received.</p>',
    '<p><strong>' + title + '</strong></p>',
    '<ul>',
    '<li><strong>Target ID:</strong> ' + payload.targetId + '</li>',
    '<li><strong>Deadline:</strong> ' + deadline + '</li>',
    '<li><strong>City:</strong> ' + (payload.targetCity || 'unknown') + '</li>',
    '<li><strong>Location:</strong> ' + (payload.targetLocationDescription || 'unknown') + '</li>',
    '<li><strong>Radius:</strong> ' + (payload.targetRadiusMeters ? payload.targetRadiusMeters + ' meters' : 'unknown') + '</li>',
    payload.targetImageUrl ? '<li><strong>Target image:</strong> <a href="' + payload.targetImageUrl + '">View target image</a></li>' : '',
    '</ul>',
    '<p><strong>Registration ID:</strong> ' + payload.registrationId + '</p>'
  ].join('');

  return {
    subject: subject,
    text: text,
    html: html
  };
};
