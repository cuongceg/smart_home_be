const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin Initialized successfully!");
}

const sendNotification = async (fcmToken, title, body, data = {}) => {
  try {
    const message = {
      notification: { title, body },
      data: data,
      token: fcmToken,
    };
    const response = await admin.messaging().send(message);
    console.log("Notification sent:", response);
    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

module.exports = { sendNotification };
