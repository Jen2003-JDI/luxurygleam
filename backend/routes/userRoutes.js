const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc  Get all users (with search & filter) | @route GET /api/users | @access Admin
router.get('/', protect, admin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role, isActive } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const skip = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password')
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
}));

// @desc  Get single user with order stats | @route GET /api/users/:id | @access Admin
router.get('/:id', protect, admin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) { res.status(404); throw new Error('User not found'); }

  // Fetch order stats for this user
  const orders = await Order.find({ user: req.params.id });
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;

  res.json({
    success: true,
    user,
    stats: { totalOrders, totalSpent, deliveredOrders },
  });
}));

// @desc  Update user info (name, phone, address, isActive) | @route PUT /api/users/:id | @access Admin
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  const { name, phone, address, isActive } = req.body;
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = { ...user.address, ...address };
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();
  const updated = await User.findById(req.params.id).select('-password');
  res.json({ success: true, user: updated });
}));

// @desc  Update user role | @route PUT /api/users/:id/role | @access Admin
router.put('/:id/role', protect, admin, asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) { res.status(400); throw new Error('Role must be "user" or "admin"'); }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, user });
}));

// @desc  Toggle user active status | @route PUT /api/users/:id/status | @access Admin
router.put('/:id/status', protect, admin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, user: { _id: user._id, name: user.name, isActive: user.isActive }, message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully` });
}));

// @desc  Permanently delete user | @route DELETE /api/users/:id | @access Admin
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400); throw new Error('You cannot delete your own account');
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User permanently deleted' });
}));

module.exports = router;
