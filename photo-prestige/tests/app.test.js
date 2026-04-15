process.env.GATEWAY_PROXY_TIMEOUT_MS = '100';
process.env.GATEWAY_RETRY_ATTEMPTS = '2';
process.env.GATEWAY_RETRY_DELAY_MS = '0';
process.env.GATEWAY_CIRCUIT_BREAKER_THRESHOLD = '2';
process.env.GATEWAY_CIRCUIT_BREAKER_RESET_TIMEOUT_MS = '10';

var request = require('supertest');
var app = require('../app');

function createFetchResponse(payload, statusCode, contentType) {
  var text = typeof payload === 'string' ? payload : JSON.stringify(payload);

  return {
    status: statusCode || 200,
    headers: {
      get: function(name) {
        if (String(name).toLowerCase() === 'content-type') {
          return contentType || 'application/json';
        }

        return null;
      }
    },
    text: function() {
      return Promise.resolve(text);
    }
  };
}

function createProxyPayload(target, path, method, body) {
  return {
    proxiedTo: target,
    path: path,
    method: method,
    body: body || {}
  };
}

describe('photo-prestige app', function() {
  beforeEach(function() {
    global.fetch = jest.fn();
  });

  it('renders the home page', async function() {
    var response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Photo Prestige');
  });

  it('renders the auth page', async function() {
    var response = await request(app).get('/auth-demo');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Auth');
  });

  it('renders the register page', async function() {
    var response = await request(app).get('/register-demo');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Register');
  });

  it('renders the score page', async function() {
    var response = await request(app).get('/score-demo');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Score');
  });

  it('renders the target page', async function() {
    var response = await request(app).get('/target-demo');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Target');
  });

  it('renders the read page', async function() {
    var response = await request(app).get('/read-demo');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Read');
  });

  it('renders the clock page', async function() {
    var response = await request(app).get('/clock-demo');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Clock');
  });

  it('renders the mail page', async function() {
    var response = await request(app).get('/mail-demo');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Mail');
  });

  it('returns API health information', async function() {
    var response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      version: 'v1',
      service: 'api-gateway'
    });
  });

  it('proxies login requests to the auth service', async function() {
    var payload = {
      email: 'test@example.com',
      password: 'secret'
    };

    global.fetch.mockResolvedValueOnce(createFetchResponse(
      createProxyPayload('http://auth-service:3001', '/login', 'POST', payload)
    ));

    var response = await request(app)
      .post('/api/v1/auth/login')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      proxiedTo: 'http://auth-service:3001',
      path: '/login',
      method: 'POST',
      body: payload
    });
  });

  it('proxies registration routes to the register service', async function() {
    global.fetch.mockResolvedValueOnce(createFetchResponse(
      createProxyPayload('http://register-service:3003', '/api/v1/me/registrations', 'GET', {})
    ));

    var response = await request(app).get('/api/v1/me/registrations');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      proxiedTo: 'http://register-service:3003',
      path: '/api/v1/me/registrations',
      method: 'GET',
      body: {}
    });
  });

  it('proxies score routes to the score service', async function() {
    global.fetch.mockResolvedValueOnce(createFetchResponse(
      createProxyPayload('http://score-service:3005', '/api/v1/targets/target-123/score', 'GET', {})
    ));

    var response = await request(app).get('/api/v1/targets/target-123/score');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      proxiedTo: 'http://score-service:3005',
      path: '/api/v1/targets/target-123/score',
      method: 'GET',
      body: {}
    });
  });

  it('proxies target routes to the target service', async function() {
    global.fetch.mockResolvedValueOnce(createFetchResponse(
      createProxyPayload('http://target-service:3002', '/', 'GET', {})
    ));

    var response = await request(app).get('/api/v1/targets');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      proxiedTo: 'http://target-service:3002',
      path: '/',
      method: 'GET',
      body: {}
    });
  });

  it('proxies mail routes to the mail service', async function() {
    global.fetch.mockResolvedValueOnce(createFetchResponse(
      createProxyPayload('http://mail-service:3006', '/health', 'GET', {})
    ));

    var response = await request(app).get('/api/v1/mail/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      proxiedTo: 'http://mail-service:3006',
      path: '/health',
      method: 'GET',
      body: {}
    });
  });

  it('proxies read routes to the read service', async function() {
    global.fetch.mockResolvedValueOnce(createFetchResponse(
      createProxyPayload('http://read-service:3007', '/contests/active?city=Eindhoven', 'GET', {})
    ));

    var response = await request(app).get('/api/v1/read/contests/active?city=Eindhoven');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      proxiedTo: 'http://read-service:3007',
      path: '/contests/active?city=Eindhoven',
      method: 'GET',
      body: {}
    });
  });

  it('proxies clock routes to the clock service', async function() {
    global.fetch.mockResolvedValueOnce(createFetchResponse(
      createProxyPayload('http://clock-service:3004', '/health', 'GET', {})
    ));

    var response = await request(app).get('/api/v1/clock/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      proxiedTo: 'http://clock-service:3004',
      path: '/health',
      method: 'GET',
      body: {}
    });
  });

  it('retries once when an upstream call fails and then succeeds', async function() {
    global.fetch
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
      .mockResolvedValueOnce(createFetchResponse(
        createProxyPayload('http://mail-service:3006', '/health', 'GET', {})
      ));

    var response = await request(app).get('/api/v1/mail/health');

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('renders the error page for unknown routes', async function() {
    var response = await request(app).get('/this-route-does-not-exist');

    expect(response.status).toBe(404);
    expect(response.text).toContain('Not Found');
  });
});
