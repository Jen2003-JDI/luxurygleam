const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isGlobal: { type: Boolean, default: false },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ['order', 'promotion', 'discount', 'system'], default: 'system' },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
