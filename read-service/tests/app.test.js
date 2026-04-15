jest.mock('../services/readService', function() {
  return {
    listActiveContests: jest.fn()
  };
});

var request = require('supertest');

var app = require('../app');
var readService = require('../services/readService');

describe('read-service app', function() {
  beforeEach(function() {
    jest.resetAllMocks();
  });

  it('returns read service health', async function() {
    var response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      version: 'v1',
      service: 'read-service'
    });
  });

  it('returns active contests overview', async function() {
    readService.listActiveContests.mockResolvedValue({
      count: 1,
      contests: [
        {
          contestId: 'target-1',
          title: 'Eindhoven Centrum',
          status: 'active'
        }
      ]
    });

    var response = await request(app)
      .get('/contests/active')
      .query({ city: 'Eindhoven', limit: '5' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      count: 1,
      contests: [
        {
          contestId: 'target-1',
          title: 'Eindhoven Centrum',
          status: 'active'
        }
      ]
    });
    expect(readService.listActiveContests).toHaveBeenCalledWith(expect.objectContaining({
      city: 'Eindhoven',
      limit: '5'
    }));
  });

  it('forwards query validation errors', async function() {
    var error = new Error('Invalid coordinates in query');
    error.statusCode = 400;
    readService.listActiveContests.mockRejectedValue(error);

    var response = await request(app)
      .get('/contests/active')
      .query({ lat: 'abc', lng: '5.1' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Invalid coordinates in query'
    });
  });
});
