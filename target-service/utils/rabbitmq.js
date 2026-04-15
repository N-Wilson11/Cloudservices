var amqp = require('amqplib');
var env = require('../config/env');

var EXCHANGE = env.rabbitmqExchange;
var EXCHANGE_TYPE = 'topic';
var RECONNECT_DELAY_MS = env.rabbitmqReconnectDelayMs;

var _connection = null;
var _channel = null;
var _reconnectTimer = null;

function clearReconnectTimer() {
  if (_reconnectTimer) {
    clearTimeout(_reconnectTimer);
    _reconnectTimer = null;
  }
}

function scheduleReconnect() {
  clearReconnectTimer();
  _connection = null;
  _channel = null;

  _reconnectTimer = setTimeout(function() {
    console.log('[rabbitmq] reconnecting...');
    connect().catch(function(error) {
      console.error('[rabbitmq] reconnect failed:', error.message);
    });
  }, RECONNECT_DELAY_MS);
}

async function connect() {
  try {
    _connection = await amqp.connect(env.rabbitmqUrl);
    _channel = await _connection.createChannel();

    await _channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });

    console.log('[rabbitmq] connected, exchange:', EXCHANGE);

    _connection.on('error', function(error) {
      console.error('[rabbitmq] connection error:', error.message);
      scheduleReconnect();
    });

    _connection.on('close', function() {
      console.warn('[rabbitmq] connection closed');
      scheduleReconnect();
    });
  } catch (error) {
    console.error('[rabbitmq] connect failed:', error.message);
    scheduleReconnect();
  }
}

function publish(routingKey, message) {
  if (!_channel) {
    console.warn('[rabbitmq] publish skipped - channel not ready:', routingKey);
    return;
  }

  var content = Buffer.from(JSON.stringify(message));
  _channel.publish(EXCHANGE, routingKey, content, { persistent: true });
  console.log('[rabbitmq] published:', routingKey);
}

async function close() {
  clearReconnectTimer();

  if (_channel) {
    await _channel.close().catch(function() {});
  }

  if (_connection) {
    await _connection.close().catch(function() {});
  }

  _channel = null;
  _connection = null;
  console.log('[rabbitmq] connection closed');
}

module.exports = {
  connect: connect,
  publish: publish,
  close: close
};
