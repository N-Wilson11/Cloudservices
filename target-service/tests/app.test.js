var request = require('supertest');
var app = require('../app');

describe('target-service app', function() {
  it('returns target service health', async function() {
    var response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      version: 'v1',
      service: 'target-service'
    });
  });

  it('requires a bearer token to create a target', async function() {
    var response = await request(app)
      .post('/')
      .send({
        title: 'Test target',
        imageUrl: 'https://example.com/image.jpg',
        lat: 51.6889,
        lng: 5.3036,
        deadlineAt: '2030-01-01T12:00:00.000Z'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Missing bearer token');
  });

  it('rejects invalid bearer tokens for protected target routes', async function() {
    var response = await request(app)
      .delete('/507f1f77bcf86cd799439011')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid token');
  });

  it('requires a bearer token to update a target deadline', async function() {
    var response = await request(app)
      .patch('/507f1f77bcf86cd799439011/deadline')
      .send({ deadlineAt: '2030-01-01T12:00:00.000Z' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Missing bearer token');
  });

  it('rejects invalid bearer tokens for submission routes', async function() {
    var response = await request(app)
      .post('/507f1f77bcf86cd799439011/submissions')
      .set('Authorization', 'Bearer fake-token')
      .send({ imageUrl: 'https://example.com/image.jpg' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid token');
  });

  it('requires a bearer token to vote on a target', async function() {
    var response = await request(app)
      .post('/507f1f77bcf86cd799439011/vote')
      .send({ vote: 'up' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Missing bearer token');
  });
});
