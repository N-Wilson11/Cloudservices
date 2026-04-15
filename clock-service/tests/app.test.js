var request = require('supertest');
var app = require('../app');

describe('clock-service app', function() {
  it('returns clock service health', async function() {
    var response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      version: 'v1',
      service: 'clock-service'
    });
  });
});
