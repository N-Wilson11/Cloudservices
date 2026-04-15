var request = require('supertest');
var app = require('../app');

describe('auth-service app', function() {
  it('returns auth service health', async function() {
    var response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      version: 'v1',
      service: 'auth-service'
    });
  });

  it('validates register payload', async function() {
    var response = await request(app)
      .post('/register')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Email and password are required');
  });

  it('validates login payload', async function() {
    var response = await request(app)
      .post('/login')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Email and password are required');
  });

  it('requires a bearer token for profile requests', async function() {
    var response = await request(app).get('/me');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Missing bearer token');
  });

  it('rejects invalid bearer tokens for profile requests', async function() {
    var response = await request(app)
      .get('/me')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid token');
  });

  it('requires a bearer token for users listing', async function() {
    var response = await request(app).get('/users');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Missing bearer token');
  });
});
