module.exports = {
  port: process.env.PORT || 3007,
  targetServiceUrl: process.env.TARGET_SERVICE_URL || 'http://target-service:3002',
  requestTimeoutMs: process.env.REQUEST_TIMEOUT_MS ? Number(process.env.REQUEST_TIMEOUT_MS) : 5000
};