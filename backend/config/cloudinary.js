const cloudinary = require('cloudinary');
const multer = require('multer');
const cloudinaryStorage = require('multer-storage-cloudinary');
const cloudinaryV2 = cloudinary.v2;

cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const productStorage = cloudinaryStorage({
  cloudinary,
  folder: 'luxury-gleam/products',
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
});

const avatarStorage = cloudinaryStorage({
  cloudinary,
  folder: 'luxury-gleam/avatars',
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
});

const reviewStorage = cloudinaryStorage({
  cloudinary,
  folder: 'luxury-gleam/reviews',
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
});

const uploadProductImages = multer({ storage: productStorage }).array('images', 5);
const uploadAvatar = multer({ storage: avatarStorage }).single('avatar');
const uploadReviewImages = multer({ storage: reviewStorage }).array('images', 3);

const deleteImage = async (publicId) => {
  if (publicId) await cloudinaryV2.uploader.destroy(publicId);
};

module.exports = { cloudinary: cloudinaryV2, uploadProductImages, uploadAvatar, uploadReviewImages, deleteImage };
