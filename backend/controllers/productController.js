const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const { deleteImage } = require('../config/cloudinary');

const resolveDiscountPrice = (basePrice, discountInput) => {
  const price = Number(basePrice) || 0;
  const rawDiscount = Number(discountInput) || 0;
  if (rawDiscount <= 0 || price <= 0) return 0;

  // Backward-compatible behavior: values between 0 and 100 are treated as percentage off.
  if (rawDiscount > 0 && rawDiscount < 100) {
    return Number((price * (1 - rawDiscount / 100)).toFixed(2));
  }

  // Otherwise treat as explicit sale price.
  return Number(rawDiscount.toFixed(2));
};

// @desc Get all products with search & filter | @route GET /api/products | @access Public
const getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, page = 1, limit = 10, sort } = req.query;
  const query = { isActive: true };
  if (keyword && String(keyword).trim()) {
    const normalizedKeyword = String(keyword).trim();
    const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escapedKeyword, $options: 'i' } },
      { description: { $regex: escapedKeyword, $options: 'i' } },
      { category: { $regex: escapedKeyword, $options: 'i' } },
      { material: { $regex: escapedKeyword, $options: 'i' } },
      { gemstone: { $regex: escapedKeyword, $options: 'i' } },
      { tags: { $elemMatch: { $regex: escapedKeyword, $options: 'i' } } },
    ];
  }
  if (category) query.category = category;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  const sortObj = {};
  if (sort === 'price_asc') sortObj.price = 1;
  else if (sort === 'price_desc') sortObj.price = -1;
  else if (sort === 'rating') sortObj.ratings = -1;
  else sortObj.createdAt = -1;
  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(query);
  const products = await Product.find(query).sort(sortObj).skip(skip).limit(Number(limit)).populate('seller', 'name');
  res.json({ success: true, products, page: Number(page), pages: Math.ceil(total / Number(limit)), total });
});

// @desc Get featured products | @route GET /api/products/featured | @access Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(25);
  res.json({ success: true, products });
});

// @desc Get single product | @route GET /api/products/:id | @access Public
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('seller', 'name avatar');
  if (!product || !product.isActive) { res.status(404); throw new Error('Product not found'); }
  res.json({ success: true, product });
});

// @desc Create product | @route POST /api/products | @access Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, discountPrice, category, material, gemstone, stock, isFeatured, tags } = req.body;
  if (!name || !description || !price || !stock || !category) {
    res.status(400); throw new Error('Please provide all required fields: name, description, price, stock, category');
  }
  if (!req.files || req.files.length === 0) {
    res.status(400); throw new Error('At least one product image is required');
  }
  const images = req.files
    .map((f) => ({
      url: f.path || f.secure_url || f.url || '',
      publicId: f.filename || f.public_id || '',
    }))
    .filter((img) => img.url && img.publicId);
  if (images.length === 0) {
    res.status(400); throw new Error('Image upload failed. Please try again with JPG/PNG/WEBP/HEIC images.');
  }
  const parsedPrice = Number(price);
  const parsedStock = Number(stock);
  const finalDiscountPrice = resolveDiscountPrice(parsedPrice, discountPrice);

  if (finalDiscountPrice >= parsedPrice && finalDiscountPrice > 0) {
    res.status(400); throw new Error('Discount must result in a sale price lower than the original price');
  }

  const product = await Product.create({
    name, description, price: parsedPrice,
    discountPrice: finalDiscountPrice,
    category, material: material || '', gemstone: gemstone || '',
    stock: parsedStock,
    isFeatured: isFeatured === 'true' || isFeatured === true,
    tags: tags ? JSON.parse(tags) : [],
    images, seller: req.user._id,
  });
  res.status(201).json({ success: true, product });
});

// @desc Update product | @route PUT /api/products/:id | @access Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const stringFields = ['name', 'description', 'category', 'material', 'gemstone'];
  stringFields.forEach((f) => { if (req.body[f] !== undefined) product[f] = req.body[f]; });

  if (req.body.price !== undefined) product.price = Number(req.body.price);
  if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
  if (req.body.isActive !== undefined) product.isActive = req.body.isActive === 'true' || req.body.isActive === true;

  if (req.body.discountPrice !== undefined) {
    const basePrice = req.body.price !== undefined ? Number(req.body.price) : Number(product.price);
    const finalDiscountPrice = resolveDiscountPrice(basePrice, req.body.discountPrice);
    if (finalDiscountPrice >= basePrice && finalDiscountPrice > 0) {
      res.status(400); throw new Error('Discount must result in a sale price lower than the original price');
    }
    product.discountPrice = finalDiscountPrice;
  }

  if (req.body.isFeatured !== undefined) product.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
  if (req.body.tags) product.tags = JSON.parse(req.body.tags);
  if (req.files && req.files.length > 0) {
    for (const img of product.images) await deleteImage(img.publicId);
    const uploadedImages = req.files
      .map((f) => ({
        url: f.path || f.secure_url || f.url || '',
        publicId: f.filename || f.public_id || '',
      }))
      .filter((img) => img.url && img.publicId);
    if (uploadedImages.length > 0) product.images = uploadedImages;
  }
  await product.save();
  res.json({ success: true, product });
});

// @desc Delete product | @route DELETE /api/products/:id | @access Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  for (const img of product.images) await deleteImage(img.publicId);
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted successfully' });
});

module.exports = { getProducts, getProduct, getFeaturedProducts, createProduct, updateProduct, deleteProduct };
