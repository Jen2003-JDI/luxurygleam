const express = require('express');
const router = express.Router();
const { getNotifications, markRead, markAllRead, sendPromoNotification } = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markRead);
router.post('/promo', protect, admin, sendPromoNotification);

module.exports = router;
