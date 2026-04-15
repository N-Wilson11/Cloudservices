var amqp = require('amqplib');

var EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'photo-prestige';
var EXCHANGE_TYPE = 'topic';
var RECONNECT_DELAY_MS = Number(process.env.RABBITMQ_RECONNECT_DELAY_MS || 5000);

var rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';

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

async function restoreConsumers(channel) {
  for (var i = 0; i < _consumers.length; i += 1) {
    var consumer = _consumers[i];
    await channel.assertQueue(consumer.queue, { durable: true });
    await channel.bindQueue(consumer.queue, EXCHANGE, consumer.routingKey);
    await channel.consume(consumer.queue, makeMessageHandler(channel, consumer.handler), { noAck: false });
    console.log('[rabbitmq] consumer restored:', consumer.queue, '->', consumer.routingKey);
  }
}

async function connect() {
  try {
    _connection = await amqp.connect(rabbitmqUrl);
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
  subscribe: subscribe,
  close: close
};
