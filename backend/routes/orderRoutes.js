const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus, getSalesAnalytics } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Specific routes BEFORE param routes to avoid conflicts
router.get('/my', protect, getMyOrders);
router.get('/analytics', protect, admin, getSalesAnalytics);
router.get('/', protect, admin, getAllOrders);
router.post('/', protect, createOrder);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
