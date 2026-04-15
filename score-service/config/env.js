module.exports = {
  port: process.env.PORT || 3005,
  mongoUri: process.env.MONGODB_URI || 'mongodb://score-mongodb:27017/score-service',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672',
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || 'photo-prestige',
  rabbitmqReconnectDelayMs: Number(process.env.RABBITMQ_RECONNECT_DELAY_MS || 5000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  registerServiceUrl: process.env.REGISTER_SERVICE_URL || 'http://register-service:3003',
  targetServiceUrl: process.env.TARGET_SERVICE_URL || 'http://target-service:3002',
  imaggaApiKey: process.env.IMAGGA_API_KEY || '',
  imaggaApiSecret: process.env.IMAGGA_API_SECRET || '',
  imaggaApiBaseUrl: process.env.IMAGGA_API_BASE_URL || 'https://api.imagga.com/v2'
};
