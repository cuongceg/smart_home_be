const Device = require('../models/device');
const admin = require("../config/firebase");

const ALERT_TITLE = {
  "FIRE": "CẢNH BÁO CHÁY",
  "GAS": "CẢNH BÁO KHÍ GAS",
  "INTRUSION": "CẢNH BÁO XÂM NHẬP"
};

const createAlertAndNotify = async (deviceId, payload) => {
    // 1. Validate input đầu vào
    if (!deviceId || deviceId === 'unknown') {
        console.warn("Alert received but deviceId is missing or unknown.");
        return;
    }

    const { alertType, severity, message } = payload;
    const title = ALERT_TITLE[alertType] || "CẢNH BÁO HỆ THỐNG";

    try {
        // 2. Lấy danh sách users liên quan từ DB (Code mới ở device.js)
        const users = await Device.getUsersByDeviceId(deviceId);

        // 3. Lọc lấy mảng tokens sạch
        // - Loại bỏ null/undefined
        // - Loại bỏ chuỗi rỗng
        const tokens = users
            .map(u => u.fcm_token)
            .filter(token => token && token.trim() !== "");

        if (tokens.length === 0) {
            console.log(`No valid FCM tokens found for device ${deviceId}. Skipping notification.`);
            return;
        }

        console.log(`Sending notification to ${tokens.length} devices...`);

        // 4. Gửi thông báo qua Firebase Multicast
        const response = await admin.messaging().sendEachForMulticast({
            tokens: tokens,
            notification: {
                title: title,
                body: message || "Phát hiện bất thường từ thiết bị"
            },
            android: {
                notification: {
                    sound: 'default',
                    priority: 'high',
                    channelId: 'smart_home_alerts' // Cần khớp với config ở Flutter
                },
                priority: 'high'
            },
            data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                alertType: String(alertType),
                severity: String(severity),
                deviceId: String(deviceId) // Đảm bảo convert sang string
            },
        });

        if (response.failureCount > 0) {
            console.warn(`Failed to send ${response.failureCount} notifications.`);
        } else {
            console.log("Notifications sent successfully!");
        }

    } catch (error) {
        console.error("Error in createAlertAndNotify:", error);
    }
}

module.exports = { createAlertAndNotify };