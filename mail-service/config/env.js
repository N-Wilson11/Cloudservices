module.exports = {
  port: process.env.PORT || 3006,
  mongoUri: process.env.MAIL_MONGODB_URI || 'mongodb://mail-mongodb:27017/mail-service',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  mailFrom: process.env.MAIL_FROM || 'Photo Prestige <noreply@example.com>'
};
