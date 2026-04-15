module.exports = {
  port: process.env.PORT || 3004,
  mongoUri: process.env.MONGODB_URI || 'mongodb://clock-mongodb:27017/clock-service',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || 'photo-prestige',
  rabbitmqReconnectDelayMs: Number(process.env.RABBITMQ_RECONNECT_DELAY_MS || 5000),
  deadlineReminderMinutes: Number(process.env.DEADLINE_REMINDER_MINUTES || 60),
  deadlineReminderIntervalMinutes: Number(process.env.DEADLINE_REMINDER_INTERVAL_MINUTES || process.env.DEADLINE_REMINDER_MINUTES || 60),
  pollIntervalMs: Number(process.env.CLOCK_POLL_INTERVAL_MS || 5000)
};
