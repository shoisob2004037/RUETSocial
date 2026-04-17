import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer to use memory storage (no disk writes)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

const router = express.Router();

// Route to upload image to Cloudinary (for posts, profile pictures, etc.)
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const folder = req.body.folder || 'social_media';

    // Convert the file buffer to a base64 string for Cloudinary
    const base64String = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64String}`;

    // Determine resource type
    const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    // Upload to Cloudinary directly from the buffer
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folder,
      resource_type: resourceType,
      transformation: resourceType === 'video' ? [
        { quality: "auto" },
        { fetch_format: "auto" }
      ] : [
        { width: 1200, height: 1200, crop: "limit", quality: "auto" }
      ]
    });

    // Return the Cloudinary URL
    res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      type: resourceType
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload image', 
      error: error.message 
    });
  }
});

// Route for chat media (images and videos)
router.post('/chat-media', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const folder = req.body.folder || 'chat_media';
    const senderId = req.body.senderId;
    const recipientId = req.body.recipientId;

    // Optional: Log who is sending
    console.log(`Uploading chat media: ${req.file.originalname} (${req.file.size} bytes) from ${senderId} to ${recipientId}`);

    // Convert the file buffer to a base64 string for Cloudinary
    const base64String = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64String}`;

    // Determine resource type
    const isVideo = req.file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folder,
      resource_type: resourceType,
      transformation: isVideo ? [
        { quality: "auto" },
        { fetch_format: "auto" }
      ] : [
        { width: 800, height: 800, crop: "limit", quality: "auto" }
      ]
    });

    // Generate thumbnail for video
    let thumbnail = null;
    if (isVideo) {
      thumbnail = cloudinary.url(result.public_id, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { start_offset: '0' },
          { width: 300, height: 200, crop: 'fill' }
        ]
      });
    }

    console.log(`Upload successful: ${result.secure_url}`);

    // Return the Cloudinary URL with metadata
    res.status(200).json({
      success: true,
      media: {
        url: result.secure_url,
        publicId: result.public_id,
        type: resourceType,
        thumbnail: thumbnail,
        size: req.file.size,
        filename: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Error uploading chat media to Cloudinary:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload media', 
      error: error.message 
    });
  }
});

// Route to delete media from Cloudinary
router.delete('/delete-media/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType } = req.query;
    
    if (!publicId) {
      return res.status(400).json({ 
        success: false,
        message: 'Public ID is required' 
      });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || 'image'
    });
    
    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Media deleted successfully',
        result: result
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Media not found or already deleted',
        result: result
      });
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete media', 
      error: error.message 
    });
  }
});

// Health check endpoint for upload service
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'Cloudinary Upload Service',
    config: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Missing',
      apiKey: process.env.CLOUDINARY_API_KEY ? 'Configured' : 'Missing',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Configured' : 'Missing'
    }
  });
});

export default router;