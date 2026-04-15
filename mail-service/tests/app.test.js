var request = require('supertest');
var jwt = require('jsonwebtoken');
var app = require('../app');

function createToken() {
  return jwt.sign({
    userId: 'user-123',
    email: 'player@example.com',
    role: 'participant'
  }, 'dev-secret-change-me');
}

describe('mail-service app', function() {
  it('returns mail service health', async function() {
    var response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      version: 'v1',
      service: 'mail-service'
    });
  });

  it('requires a bearer token to send a test mail', async function() {
    var response = await request(app)
      .post('/test')
      .send({ subject: 'Test mail' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Missing bearer token');
  });

  it('rejects invalid bearer tokens for test mail requests', async function() {
    var response = await request(app)
      .post('/test')
      .set('Authorization', 'Bearer fake-token')
      .send({ subject: 'Test mail' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid token');
  });
});
