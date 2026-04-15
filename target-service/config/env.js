module.exports = {
  port: process.env.PORT || 3002,
  mongoUri: process.env.MONGODB_URI || 'mongodb://mongodb:27017/photo-prestige',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || 'photo-prestige',
  rabbitmqReconnectDelayMs: Number(process.env.RABBITMQ_RECONNECT_DELAY_MS || 5000)
};
