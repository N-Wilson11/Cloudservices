var formatDateTime = require('../utils/formatDateTime');

module.exports = function buildOwnerScoresEmail(payload) {
  var title = payload.targetTitle || 'Untitled target';
  var deadline = formatDateTime(payload.targetDeadline || payload.deadlineAt);
  var scores = Array.isArray(payload.scores) ? payload.scores : [];

  var text = [
    'All participant scores are available.',
    '',
    'Title: ' + title,
    'Target ID: ' + payload.targetId,
    'Deadline: ' + deadline,
    ''
  ];

  if (scores.length) {
    scores.forEach(function(score) {
      text.push(
        score.rank + '. ' +
        (score.userEmail || score.userId || 'unknown participant') +
        ' - similarity ' + score.similarityScore + '%' +
        (score.finalScore !== undefined && score.finalScore !== null ? ', final ' + score.finalScore : '')
      );
    });
  } else {
    text.push('No submissions were received.');
  }

  var htmlRows = scores.map(function(score) {
    return '<li><strong>#' + score.rank + '</strong> ' +
      (score.userEmail || score.userId || 'unknown participant') +
      ' - similarity ' + score.similarityScore + '%' +
      (score.finalScore !== undefined && score.finalScore !== null ? ', final ' + score.finalScore : '') +
      '</li>';
  }).join('');

  var html = [
    '<p>All participant scores are available.</p>',
    '<p><strong>' + title + '</strong></p>',
    '<ul>',
    '<li><strong>Target ID:</strong> ' + payload.targetId + '</li>',
    '<li><strong>Deadline:</strong> ' + deadline + '</li>',
    '</ul>',
    scores.length ? '<ol>' + htmlRows + '</ol>' : '<p>No submissions were received.</p>'
  ].join('');

  return {
    subject: 'All participant scores: ' + title,
    text: text.join('\n'),
    html: html
  };
};
