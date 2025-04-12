const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const Upload = require('../models/Upload');

const upload = multer({ storage: multer.memoryStorage() });

// Get all uploads
router.get('/', protect, async (req, res) => {
    try {
        const uploads = await Upload.find();
        res.json({ success: true, uploads });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Create a new upload
router.post('/', protect, upload.single('image'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { category } = req.body;
        if (!category || !['HOOKUP', 'FWB', 'RELATIONSHIP'].includes(category)) {
            return res.status(400).json({ success: false, message: 'Invalid category' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'eksubro' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        // Save to database
        const newUpload = new Upload({
            imageUrl: result.secure_url,
            category,
            uploadedBy: req.user.id,
        });
        await newUpload.save();

        res.json({ 
            success: true, 
            imageUrl: result.secure_url,
            id: newUpload._id,
            message: 'Image uploaded successfully' 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Update upload category
router.put('/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { category } = req.body;
        if (!category || !['HOOKUP', 'FWB', 'RELATIONSHIP'].includes(category)) {
            return res.status(400).json({ success: false, message: 'Invalid category' });
        }

        const upload = await Upload.findByIdAndUpdate(
            req.params.id,
            { category },
            { new: true }
        );

        if (!upload) {
            return res.status(404).json({ success: false, message: 'Upload not found' });
        }

        res.json({ success: true, upload });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Delete upload
router.delete('/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const upload = await Upload.findByIdAndDelete(req.params.id);
        if (!upload) {
            return res.status(404).json({ success: false, message: 'Upload not found' });
        }

        // Delete from Cloudinary
        const publicId = upload.imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`eksubro/${publicId}`);

        res.json({ success: true, message: 'Upload deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;