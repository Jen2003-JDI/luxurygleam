const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendPushNotification } = require('../config/pushNotification');

const STATUS_MESSAGES = {
  Processing: 'Your order is now being processed. 🔄',
  Shipped: 'Great news! Your order has been shipped. 📦',
  'Out for Delivery': 'Your order is out for delivery! 🚚',
  Delivered: 'Your order has been delivered. Enjoy! 💎',
  Cancelled: 'Your order has been cancelled.',
  Refunded: 'Your refund has been processed successfully.',
};

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────
// @route POST /api/orders | @access Private
const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice } = req.body;
  if (!orderItems || orderItems.length === 0) {
    res.status(400); throw new Error('No order items provided');
  }
  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
    res.status(400); throw new Error('Shipping address is required');
  }
  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'COD',
    itemsPrice: Number(itemsPrice) || 0,
    shippingPrice: Number(shippingPrice) || 0,
    taxPrice: Number(taxPrice) || 0,
    totalPrice: Number(totalPrice) || 0,
    statusHistory: [{ status: 'Pending', note: 'Order placed successfully' }],
  });
  // Decrement product stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
  }
  // Push notification
  await sendPushNotification({
    userId: req.user._id,
    title: '✨ Order Placed Successfully!',
    body: `Your Luxury Gleam order #${order._id.toString().slice(-6).toUpperCase()} has been placed.`,
    type: 'order',
    data: { orderId: order._id.toString(), screen: 'OrderDetail' },
  });
  res.status(201).json({ success: true, order });
});

// ─── GET MY ORDERS ────────────────────────────────────────────────────────────
// @route GET /api/orders/my | @access Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders, count: orders.length });
});

// ─── GET SINGLE ORDER ─────────────────────────────────────────────────────────
// @route GET /api/orders/:id | @access Private
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized to view this order');
  }
  res.json({ success: true, order });
});

// ─── GET ALL ORDERS (ADMIN) ───────────────────────────────────────────────────
// @route GET /api/orders | @access Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};
  const skip = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('user', 'name email');
  res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// ─── UPDATE ORDER STATUS (ADMIN) ──────────────────────────────────────────────
// @route PUT /api/orders/:id/status | @access Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!status) { res.status(400); throw new Error('Status is required'); }
  const order = await Order.findById(req.params.id).populate('user');
  if (!order) { res.status(404); throw new Error('Order not found'); }
  const previousStatus = order.status;
  order.status = status;
  order.statusHistory.push({ status, note: note || STATUS_MESSAGES[status] || `Status updated to ${status}` });
  if (status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.isPaid = true;
    order.paidAt = Date.now();
  }
  await order.save();
  if (order.user && status !== previousStatus) {
    await sendPushNotification({
      userId: order.user._id,
      title: `Order Update: ${status}`,
      body: STATUS_MESSAGES[status] || `Your order status has been updated to ${status}.`,
      type: 'order',
      data: { orderId: order._id.toString(), screen: 'OrderDetail' },
    });
  }
  res.json({ success: true, order });
});

// ─── SALES ANALYTICS (ADMIN) ──────────────────────────────────────────────────
// @route GET /api/orders/analytics | @access Private/Admin
const getSalesAnalytics = asyncHandler(async (req, res) => {
  const targetYear = Number(req.query.year) || new Date().getFullYear();

  // Monthly revenue & orders
  const monthlyStats = await Order.aggregate([
    {
      $match: {
        status: { $ne: 'Cancelled' },
        createdAt: {
          $gte: new Date(`${targetYear}-01-01T00:00:00.000Z`),
          $lte: new Date(`${targetYear}-12-31T23:59:59.999Z`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const found = monthlyStats.find((m) => m._id === i + 1);
    return {
      month: i + 1,
      monthName: new Date(targetYear, i, 1).toLocaleString('en-US', { month: 'short' }),
      revenue: found ? Math.round(found.revenue) : 0,
      orders: found ? found.orders : 0,
    };
  });

  // Top 5 best-selling products
  const topProducts = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        name: { $first: '$orderItems.name' },
        totalQty: { $sum: '$orderItems.quantity' },
        totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
      },
    },
    { $sort: { totalQty: -1 } },
    { $limit: 5 },
  ]);

  // Category revenue breakdown (via $lookup to products collection)
  const categoryStats = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    { $unwind: '$orderItems' },
    {
      $lookup: {
        from: 'products',
        localField: 'orderItems.product',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$productInfo.category',
        totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
        totalOrders: { $sum: 1 },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  // Overall summary
  const summaryResult = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalPrice' },
        totalOrders: { $sum: 1 },
        deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
        avgOrderValue: { $avg: '$totalPrice' },
      },
    },
  ]);

  // Status count breakdown
  const statusBreakdown = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    year: targetYear,
    summary: summaryResult[0] || {
      totalRevenue: 0, totalOrders: 0,
      deliveredOrders: 0, cancelledOrders: 0, avgOrderValue: 0,
    },
    months,
    topProducts,
    categoryStats: categoryStats.filter((c) => c._id),
    statusBreakdown,
  });
});

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  getSalesAnalytics,
};
