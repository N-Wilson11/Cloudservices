var formatDateTime = require('../utils/formatDateTime');

module.exports = function buildScoreEmail(payload) {
  var targetId = payload.targetId || 'unknown target';
  var title = payload.targetTitle || 'Untitled target';
  var imageLink = payload.targetImageUrl ? 'View target image: ' + payload.targetImageUrl : null;
  var deadline = formatDateTime(payload.targetDeadline);
  var subject = 'Score available';
  var resultText = payload.isWinner ? 'You won this competition.' : 'The competition result is now available.';
  var finalScore = payload.finalScore !== undefined && payload.finalScore !== null ? payload.finalScore : null;
  var text = [
    'The score is now available.',
    '',
    'Title: ' + title,
    'Target ID: ' + targetId,
    'Similarity score: ' + (payload.similarityScore !== undefined && payload.similarityScore !== null ? payload.similarityScore + '%' : 'unknown'),
    finalScore !== null ? 'Final score: ' + finalScore : null,
    'Deadline: ' + deadline,
    'City: ' + (payload.targetCity || 'unknown'),
    'Location: ' + (payload.targetLocationDescription || 'unknown'),
    imageLink,
    '',
    resultText
  ].filter(Boolean).join('\n');
  var html = [
    '<p>The score is now available.</p>',
    '<p><strong>' + title + '</strong></p>',
    '<ul>',
    '<li><strong>Target ID:</strong> ' + targetId + '</li>',
    '<li><strong>Similarity score:</strong> ' + (payload.similarityScore !== undefined && payload.similarityScore !== null ? payload.similarityScore + '%' : 'unknown') + '</li>',
    finalScore !== null ? '<li><strong>Final score:</strong> ' + finalScore + '</li>' : '',
    '<li><strong>Deadline:</strong> ' + deadline + '</li>',
    '<li><strong>City:</strong> ' + (payload.targetCity || 'unknown') + '</li>',
    '<li><strong>Location:</strong> ' + (payload.targetLocationDescription || 'unknown') + '</li>',
    payload.targetImageUrl ? '<li><strong>Target image:</strong> <a href="' + payload.targetImageUrl + '">View target image</a></li>' : '',
    '</ul>',
    '<p>' + resultText + '</p>'
  ].join('');

  return {
    subject: subject,
    text: text,
    html: html
  };
};
