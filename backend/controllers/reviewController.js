const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { deleteImage } = require('../config/cloudinary');

// Keywords for inappropriate content detection
const INAPPROPRIATE_KEYWORDS = [
  'spam', 'fake', 'scam', 'stolen', 'counterfeit', 'adult', 'violence',
  'hate', 'racist', 'nude', 'explicit', 'offensive', 'abusive',
  'fuck', 'fucking', 'bitch', 'shit', 'asshole', 'bastard',
  'dick', 'pussy', 'cunt', 'motherfucker',
];

// Moderation function to check for inappropriate content
const checkInappropriateContent = (text = '') => {
  const lowerText = String(text).toLowerCase();
  return INAPPROPRIATE_KEYWORDS.some((keyword) => {
    const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
    return pattern.test(lowerText);
  });
};

const censorText = (text = '') => {
  return INAPPROPRIATE_KEYWORDS.reduce((acc, keyword) => {
    const pattern = new RegExp(`\\b${keyword}\\b`, 'gi');
    return acc.replace(pattern, '*'.repeat(keyword.length));
  }, String(text));
};

const sanitizeReviewContent = (review) => {
  let changed = false;

  if (typeof review.title === 'string') {
    const sanitizedTitle = censorText(review.title);
    if (sanitizedTitle !== review.title) {
      review.title = sanitizedTitle;
      changed = true;
    }
  }

  if (typeof review.comment === 'string') {
    const sanitizedComment = censorText(review.comment);
    if (sanitizedComment !== review.comment) {
      review.comment = sanitizedComment;
      changed = true;
    }
  }

  if (Array.isArray(review.replies)) {
    review.replies.forEach((reply) => {
      if (typeof reply?.text === 'string') {
        const sanitizedReplyText = censorText(reply.text);
        if (sanitizedReplyText !== reply.text) {
          reply.text = sanitizedReplyText;
          changed = true;
        }
      }
    });
  }

  return changed;
};

const sanitizeExistingPendingReviews = async () => {
  const pendingReviews = await Review.find({ status: 'pending' });
  if (!pendingReviews.length) return;

  await Promise.all(
    pendingReviews.map(async (review) => {
      const changed = sanitizeReviewContent(review);
      if (changed) await review.save();
    })
  );
};

const normalizeReviewImages = (images = []) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return images.map((img) => {
    const url = img?.url || img?.secure_url || img?.path;
    if (url) return { url, publicId: img?.publicId || img?.public_id };
    const publicId = img?.publicId || img?.public_id;
    if (publicId && cloudName) {
      return { url: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`, publicId };
    }
    return { url: null, publicId };
  }).filter((img) => !!img.url);
};

// @desc Create review (verified purchase only) | @route POST /api/reviews | @access Private
const createReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, title, comment } = req.body;
  if (!productId || !orderId || !rating || !title || !comment) {
    res.status(400); throw new Error('All review fields are required');
  }
  // Verify the user actually purchased and received this product
  const order = await Order.findOne({
    _id: orderId, user: req.user._id,
    'orderItems.product': productId, status: 'Delivered',
  });
  if (!order) {
    res.status(403); throw new Error('You can only review products from delivered orders');
  }
  const existing = await Review.findOne({ user: req.user._id, product: productId, order: orderId });
  if (existing) {
    res.status(400); throw new Error('You have already reviewed this product');
  }

  const sanitizedTitle = censorText(title);
  const sanitizedComment = censorText(comment);
  
  const images = Array.isArray(req.files)
    ? req.files
      .map((f) => ({
        url: f.path || f.secure_url || f.url,
        publicId: f.filename || f.public_id,
      }))
      .filter((img) => !!img.url)
    : [];
  const review = await Review.create({
    user: req.user._id, product: productId, order: orderId,
    rating: Number(rating), title: sanitizedTitle, comment: sanitizedComment, images, isVerifiedPurchase: true,
    status: 'pending',
  });
  
  await review.populate('user', 'name avatar');
  const hadInappropriateContent = checkInappropriateContent(title) || checkInappropriateContent(comment);
  res.status(201).json({
    success: true,
    review,
    status: 'pending',
    message: hadInappropriateContent
      ? 'Review submitted. Inappropriate words were filtered automatically.'
      : 'Review submitted successfully',
  });
});

// @desc Get product reviews (only approved & non-hidden) | @route GET /api/reviews/:productId | @access Public
const getProductReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const total = await Review.countDocuments({ 
    product: req.params.productId,
    status: 'approved',
    isHidden: false 
  });
  const reviews = await Review.find({ 
    product: req.params.productId,
    status: 'approved',
    isHidden: false 
  })
    .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
    .populate('user', 'name avatar')
    .populate('replies.user', 'name avatar role');
  const normalizedReviews = reviews.map((reviewDoc) => {
    const review = reviewDoc.toObject();
    review.images = normalizeReviewImages(review.images);
    return review;
  });
  res.json({ success: true, reviews: normalizedReviews, total, pages: Math.ceil(total / Number(limit)), page: Number(page) });
});

// @desc Get all reviews for admin | @route GET /api/reviews/admin/all | @access Private/Admin
const getAllReviews = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403); throw new Error('Only admins can view all reviews');
  }
  await sanitizeExistingPendingReviews();
  const { page = 1, limit = 20, status = 'all', productId } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  
  const filter = {};
  if (status !== 'all') filter.status = status;
  if (productId) filter.product = productId;
  
  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
    .populate('user', 'name avatar email')
    .populate('product', 'name')
    .populate('replies.user', 'name avatar role');
  const normalizedReviews = reviews.map((reviewDoc) => {
    const review = reviewDoc.toObject();
    review.images = normalizeReviewImages(review.images);
    return review;
  });
    
  res.json({ success: true, reviews: normalizedReviews, total, pages: Math.ceil(total / Number(limit)), page: Number(page) });
});

// @desc Check if user can review a product | @route GET /api/reviews/can-review/:productId/:orderId | @access Private
const canReview = asyncHandler(async (req, res) => {
  const { productId, orderId } = req.params;
  const order = await Order.findOne({
    _id: orderId, user: req.user._id,
    'orderItems.product': productId, status: 'Delivered',
  });
  const existing = await Review.findOne({ user: req.user._id, product: productId, order: orderId });
  res.json({ success: true, canReview: !!order && !existing, alreadyReviewed: !!existing });
});

// @desc Update own review (within 30 days only) | @route PUT /api/reviews/:id | @access Private
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized to update this review');
  }
  
  // Check 30-day limit
  const daysSinceCreation = Math.floor((Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceCreation > 30) {
    res.status(400); throw new Error('You can only edit reviews within 30 days of creation');
  }
  
  const { rating, title, comment, retainedImages } = req.body;

  if (rating) review.rating = Number(rating);
  if (typeof title === 'string') review.title = censorText(title);
  if (typeof comment === 'string') review.comment = censorText(comment);

  // Handle image updates: keep selected old images + append new uploads (max 3)
  if (typeof retainedImages !== 'undefined' || (Array.isArray(req.files) && req.files.length > 0)) {
    let keptImagesRaw = [];
    if (Array.isArray(retainedImages)) {
      keptImagesRaw = retainedImages;
    } else if (typeof retainedImages === 'string' && retainedImages.trim()) {
      try {
        const parsed = JSON.parse(retainedImages);
        keptImagesRaw = Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        keptImagesRaw = [];
      }
    }

    const keptImages = normalizeReviewImages(
      keptImagesRaw.map((img) => (typeof img === 'string' ? { url: img } : img))
    );

    const uploadedImages = Array.isArray(req.files)
      ? req.files
        .map((f) => ({
          url: f.path || f.secure_url || f.url,
          publicId: f.filename || f.public_id,
        }))
        .filter((img) => !!img.url)
      : [];

    const nextImages = [...keptImages, ...uploadedImages].slice(0, 3);

    const nextPublicIds = new Set(nextImages.map((img) => img.publicId).filter(Boolean));
    const removedImages = (review.images || []).filter(
      (img) => img?.publicId && !nextPublicIds.has(img.publicId)
    );

    if (removedImages.length > 0) {
      await Promise.all(removedImages.map((img) => deleteImage(img.publicId)));
    }

    review.images = nextImages;
  }

  await review.save();
  await review.populate('user', 'name avatar');
  const normalizedReview = review.toObject();
  normalizedReview.images = normalizeReviewImages(normalizedReview.images);
  res.json({ success: true, review: normalizedReview });
});

// @desc Delete review | @route DELETE /api/reviews/:id | @access Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }
  
  const isOwner = review.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    res.status(403); throw new Error('Not authorized to delete this review');
  }
  
  // Owner must delete within 30 days
  if (isOwner && !isAdmin) {
    const daysSinceCreation = Math.floor((Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation > 30) {
      res.status(400); throw new Error('You can only delete reviews within 30 days of creation');
    }
  }
  
  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted successfully' });
});

// @desc Toggle review visibility (admin only) | @route PATCH /api/reviews/:id/toggle-hidden | @access Private/Admin
const toggleReviewHidden = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403); throw new Error('Only admins can hide reviews');
  }
  const review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }
  
  review.isHidden = !review.isHidden;
  await review.save();
  res.json({ success: true, review, message: `Review ${review.isHidden ? 'hidden' : 'unhidden'}` });
});

// @desc Approve/Reject review (admin only) | @route PATCH /api/reviews/:id/status | @access Private/Admin
const updateReviewStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403); throw new Error('Only admins can update review status');
  }
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400); throw new Error('Invalid status');
  }
  
  const review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }
  
  review.status = status;
  await review.save();
  res.json({ success: true, review });
});

// @desc Reply to review (user or admin) | @route POST /api/reviews/:id/reply | @access Private
const replyToReview = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400); throw new Error('Reply text is required');
  }
  
  const review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }
  
  const reply = {
    user: req.user._id,
    text: censorText(text.trim()),
    isAdminReply: req.user.role === 'admin',
  };
  
  review.replies.push(reply);
  await review.save();
  await review.populate('replies.user', 'name avatar role');
  
  res.status(201).json({ success: true, review });
});

// @desc Get review analytics (admin only) | @route GET /api/reviews/admin/analytics | @access Private/Admin
const getReviewAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403); throw new Error('Only admins can view analytics');
  }
  
  const [totalReviews, approvedReviews, pendingReviews, rejectedReviews, avgRating] = await Promise.all([
    Review.countDocuments(),
    Review.countDocuments({ status: 'approved', isHidden: false }),
    Review.countDocuments({ status: 'pending' }),
    Review.countDocuments({ status: 'rejected' }),
    Review.aggregate([
      { $match: { status: 'approved', isHidden: false } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ])
  ]);
  
  res.json({
    success: true,
    analytics: {
      totalReviews,
      approvedReviews,
      pendingReviews,
      rejectedReviews,
      averageRating: avgRating.length > 0 ? Math.round(avgRating[0].avg * 10) / 10 : 0,
    }
  });
});

module.exports = { 
  createReview, 
  getProductReviews, 
  getAllReviews,
  updateReview, 
  deleteReview, 
  canReview,
  toggleReviewHidden,
  updateReviewStatus,
  replyToReview,
  getReviewAnalytics,
  checkInappropriateContent,
  censorText,
};
