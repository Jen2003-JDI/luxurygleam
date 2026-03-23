const express = require('express');
const router = express.Router();
const { getProducts, getProduct, getFeaturedProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadProductImages } = require('../config/cloudinary');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProduct);
router.post('/', protect, admin, uploadProductImages, createProduct);
router.put('/:id', protect, admin, uploadProductImages, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
