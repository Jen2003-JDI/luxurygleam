const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../config/pushNotification');

// @desc Get user notifications | @route GET /api/notifications | @access Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    $or: [{ user: req.user._id }, { isGlobal: true }],
  }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, notifications, count: notifications.length });
});

// @desc Mark single notification as read | @route PUT /api/notifications/:id/read | @access Private
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) { res.status(404); throw new Error('Notification not found'); }
  notification.isRead = true;
  await notification.save();
  res.json({ success: true, message: 'Notification marked as read' });
});

// @desc Mark all notifications as read | @route PUT /api/notifications/read-all | @access Private
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { $or: [{ user: req.user._id }, { isGlobal: true }], isRead: false },
    { $set: { isRead: true } }
  );
  res.json({ success: true, message: 'All notifications marked as read' });
});

// @desc Send promotional push notification to all users | @route POST /api/notifications/promo | @access Private/Admin
const sendPromoNotification = asyncHandler(async (req, res) => {
  const { title, body, imageUrl } = req.body;
  if (!title || !body) { res.status(400); throw new Error('Title and body are required'); }
  await sendPushNotification({
    title, body, type: 'promotion', isGlobal: true,
    data: { screen: 'Home', imageUrl: imageUrl || '' },
  });
  res.json({ success: true, message: 'Promotional notification sent to all users' });
});

module.exports = { getNotifications, markRead, markAllRead, sendPromoNotification };
