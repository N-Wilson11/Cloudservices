var mailService = require('../services/mailService');

exports.health = function health(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'mail-service'
  });
};

exports.sendTestMail = async function sendTestMail(req, res) {
  var result = await mailService.sendTestMail({
    to: req.body.to,
    subject: req.body.subject,
    text: req.body.text,
    html: req.body.html,
    user: req.user
  });

  res.status(200).json(result);
};
