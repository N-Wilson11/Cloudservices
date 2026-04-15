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

describe('register-service app', function() {
  it('returns register service health', async function() {
    var response = await request(app).get('/api/v1/register/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      version: 'v1',
      service: 'register-service'
    });
  });

  it('requires a bearer token to create a registration', async function() {
    var response = await request(app)
      .post('/api/v1/targets/target-123/registrations');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Missing bearer token');
  });

  it('requires a bearer token to load my registrations', async function() {
    var response = await request(app).get('/api/v1/me/registrations');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Missing bearer token');
  });

  it('rejects invalid bearer tokens', async function() {
    var response = await request(app)
      .get('/api/v1/me/registrations')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid token');
  });

  it('validates the target id before calling the controller', async function() {
    var response = await request(app)
      .post('/api/v1/targets/%20/registrations')
      .set('Authorization', 'Bearer ' + createToken());

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('targetId is required');
  });
});
