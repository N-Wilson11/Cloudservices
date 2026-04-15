var amqp = require('amqplib');
var env = require('../config/env');

var EXCHANGE = env.rabbitmqExchange;
var EXCHANGE_TYPE = 'topic';
var RECONNECT_DELAY_MS = env.rabbitmqReconnectDelayMs;

var _connection = null;
var _channel = null;
var _reconnectTimer = null;
var _consumers = [];

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

async function restoreConsumers(channel) {
  for (var i = 0; i < _consumers.length; i += 1) {
    var c = _consumers[i];
    await channel.assertQueue(c.queue, { durable: true });
    await channel.bindQueue(c.queue, EXCHANGE, c.routingKey);
    await channel.consume(c.queue, makeMessageHandler(channel, c.handler), { noAck: false });
    console.log('[rabbitmq] consumer restored:', c.queue, '->', c.routingKey);
  }
}

function makeMessageHandler(channel, handler) {
  return async function(msg) {
    if (!msg) {
      return;
    }

    try {
      var content = JSON.parse(msg.content.toString());
      await handler(content);
      channel.ack(msg);
    } catch (error) {
      console.error('[rabbitmq] handler error:', error.message);
      channel.nack(msg, false, false);
    }
  };
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

    await restoreConsumers(_channel);
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

async function subscribe(queue, routingKey, handler) {
  if (!_channel) {
    throw new Error('[rabbitmq] subscribe called before connect()');
  }

  await _channel.assertQueue(queue, { durable: true });
  await _channel.bindQueue(queue, EXCHANGE, routingKey);
  await _channel.consume(queue, makeMessageHandler(_channel, handler), { noAck: false });

  _consumers.push({ queue: queue, routingKey: routingKey, handler: handler });
  console.log('[rabbitmq] subscribed:', queue, '->', routingKey);
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
  _consumers = [];
  console.log('[rabbitmq] connection closed');
}

module.exports = {
  connect: connect,
  publish: publish,
  subscribe: subscribe,
  close: close
};
