const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    isAdminReply: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true },
    comment: { type: String, required: true, trim: true },
    images: [{ url: String, publicId: String }],
    isVerifiedPurchase: { type: Boolean, default: true },
    helpfulVotes: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isHidden: { type: Boolean, default: false },
    replies: [replySchema],
    flaggedReason: String,
  },
  { timestamps: true }
);

// One review per user per product per order
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

// Update product rating after save/delete (only approved reviews)
reviewSchema.post('save', async function () {
  await updateProductRating(this.product);
});

reviewSchema.post('deleteOne', { document: true }, async function () {
  await updateProductRating(this.product);
});

async function updateProductRating(productId) {
  const Product = mongoose.model('Product');
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { product: productId, status: 'approved', isHidden: false } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratings: Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { ratings: 0, numReviews: 0 });
  }
}

module.exports = mongoose.model('Review', reviewSchema);
