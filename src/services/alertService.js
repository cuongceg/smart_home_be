const Device = require('../models/device');
const admin = require("../config/firebase");

const ALERT_TITLE = {
  "FIRE": "CẢNH BÁO CHÁY",
  "GAS": "CẢNH BÁO KHÍ GAS",
  "INTRUSION": "CẢNH BÁO XÂM NHẬP"
};

const createAlertAndNotify = async (deviceId, payload) => {
    if (deviceId === 'unknown')
        return;

    const {alertType, severity, message} = payload;

    const title = ALERT_TITLE[alertType] || "CẢNH BÁO HỆ THỐNG"
    try {
        const users = await Device.getUsersByDeviceId(deviceId);

        if (!users.length) return;

        const tokens = users.map(u => u.fcm_token);

        await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
                title,
                body: message
            },
            data: {
                alertType,
                severity,
                deviceId
            },
        });
    } catch (error) {
        console.error("Error sending notification:", error);
    }
}

module.exports = { createAlertAndNotify };