const express = require('express');
const router = express.Router();
const { register, login, socialLogin, getMe, updateProfile, savePushToken, removePushToken, forgotPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../config/cloudinary');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/social', socialLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadAvatar, updateProfile);
router.post('/push-token', protect, savePushToken);
router.delete('/push-token', protect, removePushToken);

module.exports = router;
