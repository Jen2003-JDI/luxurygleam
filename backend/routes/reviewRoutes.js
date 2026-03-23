const express = require('express');
const router = express.Router();
const { 
  createReview, 
  getProductReviews, 
  getAllReviews,
  updateReview, 
  deleteReview, 
  canReview,
  toggleReviewHidden,
  updateReviewStatus,
  replyToReview,
  getReviewAnalytics
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { uploadReviewImages } = require('../config/cloudinary');

// User routes
router.post('/', protect, uploadReviewImages, createReview);
router.get('/can-review/:productId/:orderId', protect, canReview);
router.get('/:productId', getProductReviews);
router.put('/:id', protect, uploadReviewImages, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/reply', protect, replyToReview);

// Admin routes
router.get('/admin/all', protect, getAllReviews);
router.get('/admin/analytics', protect, getReviewAnalytics);
router.patch('/:id/toggle-hidden', protect, toggleReviewHidden);
router.patch('/:id/status', protect, updateReviewStatus);

module.exports = router;
