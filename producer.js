// producer.js
const mqtt = require('mqtt');

const BROKER_URL = 'mqtt://68.183.188.187:1885'; // Đổi thành IP máy ảo nếu chạy Docker
const TOPIC_PREFIX = 'smart_home';
const DEVICE = {
    controller_key: 'controller-01' 
};
const OPTIONS = {
    username: 'mqtt_admin',
    password: '12345678@abc'
};

const client = mqtt.connect(BROKER_URL, OPTIONS);

client.on('connect', () => {
    console.log(`✅ Connected to MQTT Broker at ${BROKER_URL}`);
    
    // Bắt đầu gửi dữ liệu mỗi 2 giây
    setInterval(() => {
        sendTelemetry(DEVICE);
    }, 2000);
});

client.on('error', (err) => {
    console.error('❌ MQTT Error:', err);
});

// Hàm sinh dữ liệu ngẫu nhiên (Random Walk)
// Để biểu đồ trông mượt hơn, giá trị mới sẽ chỉ lệch một chút so với giá trị cũ
let lastTemp = 30.0;
let lastHum = 60.0;
let lastGas = 100.0;

function sendTelemetry(device) {
    // Random dao động nhẹ
    lastTemp += (Math.random() - 0.5) * 1.5; // +/- 0.75 độ
    lastHum += (Math.random() - 0.5) * 2.0;  // +/- 1%
    lastGas += (Math.random() - 0.5) * 10;   // +/- 5 ppm

    // Giới hạn biên độ hợp lý
    if (lastTemp < 15) lastTemp = 15; if (lastTemp > 45) lastTemp = 45;
    if (lastHum < 30) lastHum = 30; if (lastHum > 90) lastHum = 90;
    if (lastGas < 50) lastGas = 50; if (lastGas > 500) lastGas = 500;

    const payload = {
        temperature: parseFloat(lastTemp.toFixed(2)),
        humidity: parseFloat(lastHum.toFixed(2)),
        gas: Math.floor(lastGas),
        timestamp: Date.now() // Lấy thời gian hiện tại (Unix ms)
    };

    const topic = `${TOPIC_PREFIX}/${device.controller_key}/telemetry`;
    const message = JSON.stringify(payload);

    client.publish(topic, message, { qos: 0, retain: false }, (err) => {
        if (err) {
            console.error('Publish error:', err);
        } else {
            console.log(`📤 [${topic}] Sent:`, message);
        }
    });
}