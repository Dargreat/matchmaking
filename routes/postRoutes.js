const express = require('express');
const router = express.Router();
const { protect, adminProtect } = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const {upload, cloudinary} = require('../config/cloudinary');
const Payment = require('../models/Payment');
// const multer = require('multer');

// // Configure multer for file uploads
// const upload = multer({ storage: multer.memoryStorage() });


router.get('/dashboard', protect, async (req, res) => {
    try {
        // Get user's successful payments
        const payments = await Payment.find({ 
            user: req.user.id,
            status: 'successful'
        }).populate('post');  // Populate the post details
        
        // Extract and format the paid posts
        const paidPosts = payments.map(payment => ({
            ...payment.post.toObject(),
            paymentDate: payment.paidAt,
            paymentMethod: payment.paymentMethod
        }));
        
        res.json({
            success: true,
            posts: paidPosts
        });
    } catch (error) {
        console.error('Paid posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private (Admin only)
// In your routes file
router.post('/', adminProtect, upload.single('image'), async (req, res) => {
    try {
        // Fields are now in req.body (make sure to use express.json() before multer)
        const { name, phoneNumber, category, price, isFeatured } = req.body;

        // Validate category
        const validCategories = ['FWB', 'HOOKUP', 'RELATIONSHIP', 'GENERAL'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ success: false, message: 'Invalid category' });
        }

        // Create new post - image URL is already in req.file.path
        const newPost = new Post({
            name,
            phoneNumber,
            category,
            imageUrl: req.file ? req.file.path : '', // Cloudinary URL from multer-storage-cloudinary
            price: price || 5000,
            isFeatured: isFeatured === 'true'
        });

        await newPost.save();

        res.status(201).json({ success: true, post: newPost });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/posts
// @desc    Get all posts (filtered by category if provided)
// @access  Public
router.get('/', protect, async (req, res) => {
    try {
        const { category } = req.query;
        const query = {};
        
        if (category) {
            query.category = category;
        }

        console.log(query);
        const posts = await Post.find(query);
        console.log(posts);
        
        
        // For each post, check if user has purchased it
        const postsWithAccess = await Promise.all(posts.map(async post => {
            const postObj = post.toObject();
            const hasAccess = post.purchasedBy.includes(req.user.id);
            return {
                ...postObj,
                hasAccess
            };
        }));

        res.status(200).json({ success: true, posts: postsWithAccess });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


// @route   GET /api/posts/:id
// @desc    Get single post by ID
// @access  Public
router.get('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const postObj = post.toObject();
        const hasAccess = post.purchasedBy.includes(req.user.id);
        
        if (!hasAccess) {
            delete postObj.phoneNumber;
        }

        res.status(200).json({ 
            success: true, 
            post: {
                ...postObj,
                hasAccess
            }
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private (Admin only)
router.put('/:id', adminProtect, upload.single('image'), async (req, res) => {
    try {
        const { title, content, category, isFeatured } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Update fields
        post.title = title || post.title;
        post.content = content || post.content;
        post.category = category || post.category;
        post.isFeatured = isFeatured ? isFeatured === 'true' : post.isFeatured;

        // Update image if provided
        if (req.file) {
            // Delete old image from Cloudinary if exists
            if (post.imageUrl) {
                const publicId = post.imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`eksubro/posts/${publicId}`);
            }

            // Upload new image
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'eksubro/posts' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });
            post.imageUrl = result.secure_url;
        }

        await post.save();

        res.json({ success: true, post });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private (Admin only)
router.delete('/:id', adminProtect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Delete image from Cloudinary if exists
        if (post.imageUrl) {
            const publicId = post.imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`eksubro/posts/${publicId}`);
        }

        await post.remove();

        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});



module.exports = router;