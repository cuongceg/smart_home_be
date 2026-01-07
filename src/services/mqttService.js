const mqtt = require('mqtt');
const User = require('../models/user');
const { createAlertAndNotify } = require('./alertService');

const BROKER_URL = process.env.MQTT_BROKER || '';
const TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'smart_home';
const OPTIONS = {
  username: process.env.MQTT_USERNAME || '',
  password: process.env.MQTT_PASSWORD || '',
};

const alertCooldownCache = new Map();
const COOLDOWN_PERIOD = 60 * 1000; // 1 phút = 60,000ms

let client = null;

const isInCooldown = (deviceId, alertType) => {
  const deviceCache = alertCooldownCache.get(deviceId);
  if (!deviceCache) {
    return false;
  }

  const lastAlertTime = deviceCache[alertType];
  if (!lastAlertTime) {
    return false;
  }

  const now = Date.now();
  return (now - lastAlertTime) < COOLDOWN_PERIOD;
};

// Hàm cập nhật cooldown cache
const updateCooldownCache = (deviceId, alertType) => {
  let deviceCache = alertCooldownCache.get(deviceId);
  if (!deviceCache) {
    deviceCache = {};
    alertCooldownCache.set(deviceId, deviceCache);
  }

  deviceCache[alertType] = Date.now();

  cleanupExpiredCache();
};

const cleanupExpiredCache = () => {
  const now = Date.now();
  
  for (const [deviceId, deviceCache] of alertCooldownCache.entries()) {
    const alertTypes = Object.keys(deviceCache);
    
    for (const alertType of alertTypes) {
      if ((now - deviceCache[alertType]) >= COOLDOWN_PERIOD) {
        delete deviceCache[alertType];
      }
    }

    if (Object.keys(deviceCache).length === 0) {
      alertCooldownCache.delete(deviceId);
    }
  }
};

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
      const alertType = data.alertType || 'UNKNOWN';

      if (isInCooldown(deviceId, alertType)) {
        console.log(`⏱️  MQTT: Alert ${alertType} for device ${deviceId} is in cooldown period, skipping...`);
        return;
      }

      await createAlertAndNotify(deviceId, data);
      updateCooldownCache(deviceId, alertType);
      
      console.log(`✅ MQTT: Alert ${alertType} processed for device ${deviceId}, cooldown activated for 1 minute`);

    } catch (err) {
      console.error('MQTT message handler error:', err);
    }
  });

  setInterval(() => {
    cleanupExpiredCache();
    console.log(`🧹 MQTT: Cleaned up expired alert cache. Active devices: ${alertCooldownCache.size}`);
  }, 5 * 60 * 1000);
};

module.exports = {initMQTT}