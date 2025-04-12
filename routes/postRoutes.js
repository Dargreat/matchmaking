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
        // Get all posts
        const posts = await Post.find().sort({ createdAt: -1 });
        
        // Get user's payments
        const payments = await Payment.find({ 
            user: req.user.id,
            status: 'successful'
        });
        
        const paidPostIds = payments.map(payment => payment.post.toString());
        
        // Add payment status to each post
        const postsWithPaymentStatus = posts.map(post => ({
            ...post.toObject(),
            paymentStatus: paidPostIds.includes(post._id.toString()) ? 'paid' : 'unpaid'
        }));
        
        res.json({
            success: true,
            posts: postsWithPaymentStatus
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private (Admin only)
router.post('/', adminProtect, upload.single('image'), async (req, res) => {
    try {
        const { name, phoneNumber, category, isFeatured, price } = req.body;

        // Validate category
        const validCategories = ['FWB', 'HOOKUP', 'RELATIONSHIP', 'GENERAL'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ success: false, message: 'Invalid category' });
        }

        // Upload image to Cloudinary if provided
        let imageUrl = '';
        if (req.file) {
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
            imageUrl = result.secure_url;
        }

        // Create new post
        const newPost = new Post({
            name,
            phoneNumber,
            category,
            imageUrl,
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

        const posts = await Post.find(query).select('-phoneNumber -purchasedBy');
        
        // For each post, check if user has purchased it
        const postsWithAccess = await Promise.all(posts.map(async post => {
            const postObj = post.toObject();
            console.log("post", post);
            console.log("postObj", postObj);
            if (!post?.purchasedBy) {
                post.purchasedBy = [];
            }
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

// @route   POST /api/posts/:id/like
// @desc    Like/unlike a post
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Check if user already liked the post
        const alreadyLiked = post.likes.includes(req.user.id);

        if (alreadyLiked) {
            // Unlike the post
            post.likes = post.likes.filter(
                userId => userId.toString() !== req.user.id.toString()
            );
        } else {
            // Like the post
            post.likes.push(req.user.id);
        }

        await post.save();

        res.json({ success: true, likes: post.likes.length, isLiked: !alreadyLiked });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


module.exports = router;