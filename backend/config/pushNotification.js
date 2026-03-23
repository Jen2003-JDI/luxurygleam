const { Expo } = require('expo-server-sdk');
const Notification = require('../models/Notification');
const User = require('../models/User');

const expo = new Expo();

const sendPushNotification = async ({ userId, title, body, data = {}, type = 'system', isGlobal = false }) => {
  try {
    let tokens = [];

    if (isGlobal) {
      const users = await User.find({ expoPushTokens: { $exists: true, $not: { $size: 0 } } });
      users.forEach((u) => tokens.push(...u.expoPushTokens));
      // Save global notification
      await Notification.create({ isGlobal: true, title, body, type, data });
    } else if (userId) {
      const user = await User.findById(userId);
      if (user && user.expoPushTokens.length > 0) {
        tokens = user.expoPushTokens;
      }
      // Save user notification
      await Notification.create({ user: userId, title, body, type, data });
    }

    // Filter valid tokens
    const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));
    if (validTokens.length === 0) return;

    const messages = validTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      badge: 1,
    }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (err) {
        console.error('Push notification error:', err);
      }
    }

    // Handle DeviceNotRegistered tokens — remove stale
    const staleTokens = [];
    tickets.forEach((ticket, idx) => {
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        staleTokens.push(validTokens[idx]);
      }
    });

    if (staleTokens.length > 0) {
      await User.updateMany(
        { expoPushTokens: { $in: staleTokens } },
        { $pull: { expoPushTokens: { $in: staleTokens } } }
      );
      console.log(`Removed ${staleTokens.length} stale push tokens`);
    }
  } catch (error) {
    console.error('sendPushNotification error:', error);
  }
};

module.exports = { sendPushNotification };
