var request = require('supertest');
var jwt = require('jsonwebtoken');
var app = require('../app');

var validTargetId = '507f1f77bcf86cd799439011';

function createToken() {
  return jwt.sign({
    userId: 'user-123',
    email: 'player@example.com',
    role: 'participant'
  }, 'dev-secret-change-me');
}

describe('score-service app', function() {
  it('returns score service health', async function() {
    var response = await request(app).get('/api/v1/score/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      version: 'v1',
      service: 'score-service'
    });
  });

  it('requires a bearer token to create a submission', async function() {
    var response = await request(app)
      .post('/api/v1/targets/' + validTargetId + '/submissions')
      .send({ imageUrl: 'https://example.com/image.jpg' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Missing bearer token');
  });

  it('requires imageUrl for submission requests', async function() {
    var response = await request(app)
      .post('/api/v1/targets/' + validTargetId + '/submissions')
      .set('Authorization', 'Bearer ' + createToken());

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('imageUrl is required');
  });

  it('rejects invalid bearer tokens for score requests', async function() {
    var response = await request(app)
      .get('/api/v1/targets/' + validTargetId + '/score')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid token');
  });

  it('requires a bearer token to load the winner', async function() {
    var response = await request(app)
      .get('/api/v1/targets/' + validTargetId + '/winner');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Missing bearer token');
  });

  it('requires a bearer token to delete a submission', async function() {
    var response = await request(app)
      .delete('/api/v1/submissions/submission-123');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Missing bearer token');
  });
});
