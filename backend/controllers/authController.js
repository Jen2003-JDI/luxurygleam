const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { deleteImage } = require('../config/cloudinary');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

// @desc Register | @route POST /api/auth/register | @access Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) { res.status(400); throw new Error('Please provide all fields'); }
  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) { res.status(400); throw new Error('User already exists with this email'); }
  const user = await User.create({ name, email: email.toLowerCase().trim(), password });
  res.status(201).json({
    success: true, token: generateToken(user._id),
    user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
  });
});

// @desc Login | @route POST /api/auth/login | @access Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error('Please provide email and password'); }
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !(await user.matchPassword(password))) { res.status(401); throw new Error('Invalid email or password'); }
  if (!user.isActive) { res.status(403); throw new Error('Your account has been deactivated. Please contact support.'); }
  res.json({
    success: true, token: generateToken(user._id),
    user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
  });
});

// @desc Social Login | @route POST /api/auth/social | @access Public
const socialLogin = asyncHandler(async (req, res) => {
  const { name, email, googleId, facebookId, avatar, authProvider } = req.body;
  if (!email) { res.status(400); throw new Error('Email is required for social login'); }
  let user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    user = await User.create({ name, email: email.toLowerCase().trim(), googleId, facebookId, avatar, authProvider });
  } else {
    if (!user.isActive) { res.status(403); throw new Error('Your account has been deactivated. Please contact support.'); }
    if (googleId) user.googleId = googleId;
    if (facebookId) user.facebookId = facebookId;
    if (avatar && !user.avatar) user.avatar = avatar;
    user.authProvider = authProvider || user.authProvider;
    await user.save();
  }
  res.json({
    success: true, token: generateToken(user._id),
    user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
  });
});

// @desc Get me | @route GET /api/auth/me | @access Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json({ success: true, user });
});

// @desc Update profile | @route PUT /api/auth/profile | @access Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  const { name, phone, password } = req.body;
  if (typeof name === 'string' && name.trim()) user.name = name.trim();
  if (typeof phone === 'string') user.phone = phone.trim();

  const address = {};

  // Accept JSON payload style: { address: { ... } }
  let jsonAddress = req.body.address;
  if (typeof jsonAddress === 'string') {
    try {
      jsonAddress = JSON.parse(jsonAddress);
    } catch (_) {
      jsonAddress = null;
    }
  }
  if (jsonAddress && typeof jsonAddress === 'object') {
    ['street', 'city', 'state', 'zip', 'country'].forEach((field) => {
      if (typeof jsonAddress[field] === 'string') address[field] = jsonAddress[field].trim();
    });
  }

  // Accept FormData payload style: address[field]
  Object.keys(req.body).forEach((key) => {
    const match = key.match(/^address\[(\w+)\]$/);
    if (match && typeof req.body[key] === 'string') address[match[1]] = req.body[key].trim();
  });

  // Accept flat payload fallback: street, city, state, zip, country
  ['street', 'city', 'state', 'zip', 'country'].forEach((field) => {
    if (typeof req.body[field] === 'string') address[field] = req.body[field].trim();
  });

  if (Object.keys(address).length > 0) user.address = { ...user.address, ...address };
  if (req.file) {
    if (user.avatarPublicId) await deleteImage(user.avatarPublicId);

    // Multer + Cloudinary adapters may expose file fields with different key names.
    const uploadedUrl = req.file.path || req.file.secure_url || req.file.url || '';
    const uploadedPublicId = req.file.filename || req.file.public_id || '';

    user.avatar = uploadedUrl;
    user.avatarPublicId = uploadedPublicId;
  }
  if (password) user.password = password;
  await user.save();
  res.json({
    success: true,
    user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role, phone: user.phone, address: user.address },
  });
});

// @desc Save push token | @route POST /api/auth/push-token | @access Private
const savePushToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) { res.status(400); throw new Error('Push token required'); }
  const user = await User.findById(req.user._id);
  if (!user.expoPushTokens.includes(token)) { user.expoPushTokens.push(token); await user.save(); }
  res.json({ success: true, message: 'Push token saved' });
});

// @desc Remove push token | @route DELETE /api/auth/push-token | @access Private
const removePushToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (token) await User.findByIdAndUpdate(req.user._id, { $pull: { expoPushTokens: token } });
  res.json({ success: true, message: 'Push token removed' });
});

// @desc Forgot password (reset by email) | @route POST /api/auth/forgot-password | @access Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || !confirmPassword) {
    res.status(400);
    throw new Error('Please provide email, new password, and confirmation password');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  if (newPassword !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    res.status(404);
    throw new Error('No account found for this email');
  }

  if (user.authProvider !== 'local') {
    res.status(400);
    throw new Error('This account uses social login. Please sign in with your provider.');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated. Please contact support.');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password reset successful. You can now sign in.' });
});

module.exports = { register, login, socialLogin, getMe, updateProfile, savePushToken, removePushToken, forgotPassword };
