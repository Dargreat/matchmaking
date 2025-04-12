const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage engine for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'matchmaking-posts', // Optional folder in Cloudinary
    format: async (req, file) => 'png', // Convert all to PNG (or keep original)
    public_id: (req, file) => `post-${Date.now()}`, // Unique filename
  },
});

const upload = multer({ storage });

module.exports = { upload, cloudinary };