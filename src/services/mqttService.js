const mqtt = require('mqtt');
const User = require('../models/user');
const { createAlertAndNotify } = require('./alertService');

const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://68.183.188.187:1885';
const TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'smart_home';
const OPTIONS = {
  username: process.env.MQTT_USERNAME || 'mqtt_admin',
  password: process.env.MQTT_PASSWORD || '12345678@abc',
};


let client = null;

const initMQTT = () => {
  client = mqtt.connect(BROKER_URL, OPTIONS);

  client.on('connect', () => {
    console.log(`MQTT: connected to ${BROKER_URL}`);

    client.subscribe(`${TOPIC_PREFIX}/+/warning`, { qos: 0 }, (err) => {
      if (err) console.error('MQTT subscribe warning error:', err);
    });
  });

  client.on('error', (err) => {
    console.error('MQTT client error:', err);
  });

  client.on('message', async (topic, payload) => {
    try {
      const message = payload.toString();
      let data = null;
      try {
        data = JSON.parse(message);
      } catch (e) {
        console.warn('MQTT: payload is not JSON, ignoring', message);
        return;
      }

      const parts = topic.split('/');
      const deviceId = parts[1] || 'unknown';

      await createAlertAndNotify(deviceId, data);
    } catch (err) {
      console.error('MQTT message handler error:', err);
    }
  });
};

module.exports = {initMQTT}
