const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const uploadController = require('../controllers/uploadController');
const router = express.Router();

console.log('=== upload.js loaded');

// Test route at the very top
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Test route hit' });
});

// Configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products', // Cloudinary folder
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// POST /api/upload/image
router.post('/upload/image', upload.single('image'), uploadController.uploadImage);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
  }
  res.status(400).json({ message: error.message });
});

module.exports = router; 