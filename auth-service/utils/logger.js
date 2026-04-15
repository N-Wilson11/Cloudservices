var morgan = require('morgan');

var serviceName = 'auth-service';

function write(level, event, fields) {
  var payload = Object.assign({
    timestamp: new Date().toISOString(),
    level: level,
    service: serviceName,
    event: event
  }, fields || {});

  if (level === 'error') {
    console.error(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}

exports.requestLogger = morgan(function(tokens, req, res) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    service: serviceName,
    event: 'request.completed',
    method: tokens.method(req, res),
    path: tokens.url(req, res),
    status: Number(tokens.status(req, res) || 0),
    responseTimeMs: Number(tokens['response-time'](req, res) || 0),
    contentLength: Number(tokens.res(req, res, 'content-length') || 0)
  });
});

exports.info = function info(event, fields) {
  write('info', event, fields);
};

exports.error = function error(event, fields) {
  write('error', event, fields);
};
