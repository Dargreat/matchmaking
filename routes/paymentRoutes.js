const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Post = require('../models/Post');
const Payment = require('../models/Payment');
const axios = require('axios');

// Paystack API configuration
const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Initiate payment for a post
router.post('/initiate', protect, async (req, res) => {
    try {
        const { postId } = req.body;
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Check if user already purchased this post
        const existingPayment = await Payment.findOne({
            user: req.user.id,
            post: postId,
            status: 'successful'
        });

        if (existingPayment) {
            return res.status(400).json({ 
                success: false, 
                message: 'You already have access to this contact' 
            });
        }

        // Check for pending payment that can be reused
        const pendingPayment = await Payment.findOne({
            user: req.user.id,
            post: postId,
            status: 'pending',
            createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) } // within last 30 mins
        });

        if (pendingPayment) {
            // Return existing payment details for retry
            return res.status(200).json({
                success: true,
                paymentId: pendingPayment._id,
                amount: pendingPayment.amount,
                reference: pendingPayment.reference,
                authorizationUrl: pendingPayment.authorizationUrl
            });
        }

        // Create new payment record
        const reference = `EKSUBRO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const payment = new Payment({
            user: req.user.id,
            post: postId,
            amount: post.price * 100, // Paystack uses amount in kobo
            reference: reference,
            status: 'pending'
        });

        // Initialize Paystack payment
        const paystackResponse = await paystack.post('/transaction/initialize', {
            email: req.user.email,
            amount: payment.amount,
            reference: payment.reference,
            callback_url: `${process.env.SITE_URL}/payment-status?reference=${payment.reference}`,
            metadata: {
                custom_fields: [
                    {
                        display_name: "Post ID",
                        variable_name: "post_id",
                        value: postId
                    },
                    {
                        display_name: "User ID",
                        variable_name: "user_id",
                        value: req.user.id
                    }
                ]
            }
        });

        // Save authorization URL for later redirect
        payment.authorizationUrl = paystackResponse.data.data.authorization_url;
        await payment.save();

        res.status(200).json({
            success: true,
            paymentId: payment._id,
            amount: payment.amount / 100, // Convert back to naira
            reference: payment.reference,
            authorizationUrl: payment.authorizationUrl
        });

    } catch (error) {
        console.error('Payment initiation error:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            message: error.response?.data?.message || 'Failed to initiate payment' 
        });
    }
});

// Verify payment callback (Paystack webhook)
router.get('/verify/:reference', protect, async (req, res) => {
    try {
        const payment = await Payment.findOne({ 
            reference: req.params.reference,
            user: req.user.id
        });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Verify payment with Paystack
        const verificationResponse = await paystack.get(`/transaction/verify/${payment.reference}`);
        const paymentData = verificationResponse.data.data;

        if (paymentData.status !== 'success') {
            return res.status(400).json({ 
                success: false, 
                message: `Payment ${paymentData.status}`,
                status: paymentData.status
            });
        }

        // Update payment record
        payment.status = 'successful';
        payment.paidAt = new Date(paymentData.paid_at);
        payment.channel = paymentData.channel;
        payment.currency = paymentData.currency;
        payment.ipAddress = paymentData.ip_address;
        await payment.save();

        // Grant user access to the post
        await Post.findByIdAndUpdate(payment.post, {
            $addToSet: { purchasedBy: req.user.id }
        });

        // Redirect to success page on frontend
        res.redirect(`${process.env.SITE_URL}/payment-success?postId=${payment.post}`);

    } catch (error) {
        console.error('Payment verification error:', error.response?.data || error.message);
        res.redirect(`${process.env.SITE_URL}/payment-failed?error=${encodeURIComponent(error.response?.data?.message || 'Payment verification failed')}`);
    }
});

router.get('/verify-payment', async (req, res) => {
    try {
        const { reference } = req.query;
        
        const payment = await Payment.findOne({ reference });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Verify with Paystack if needed
        if (payment.status === 'pending') {
            const verificationResponse = await paystack.get(`/transaction/verify/${reference}`);
            const paymentData = verificationResponse.data.data;
            
            if (paymentData.status === 'success') {
                payment.status = 'successful';
                payment.paidAt = new Date(paymentData.paid_at);
                await payment.save();
                
                // Grant access to post
                await Post.findByIdAndUpdate(payment.post, {
                    $addToSet: { purchasedBy: payment.user }
                });
            }
        }

        res.json({
            success: true,
            status: payment.status,
            amount: payment.amount / 100,
            postId: payment.post,
            paidAt: payment.paidAt
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
});

// Webhook for Paystack to verify payments (more reliable than callback)
router.post('/webhook', express.json(), async (req, res) => {
    const event = req.body;
    
    // Verify this is a legitimate request from Paystack
    if (event.event === 'charge.success') {
        const transaction = event.data;
        
        try {
            // Find the payment record
            const payment = await Payment.findOne({ reference: transaction.reference });
            
            if (payment && payment.status !== 'successful') {
                // Update payment record
                payment.status = 'successful';
                payment.paidAt = new Date(transaction.paid_at);
                payment.channel = transaction.channel;
                payment.currency = transaction.currency;
                payment.ipAddress = transaction.ip_address;
                await payment.save();

                // Grant user access to the post
                await Post.findByIdAndUpdate(payment.post, {
                    $addToSet: { purchasedBy: payment.user }
                });
            }
            
            res.status(200).send('Webhook processed');
        } catch (error) {
            console.error('Webhook processing error:', error);
            res.status(500).send('Webhook processing failed');
        }
    } else {
        res.status(200).send('Event not handled');
    }
});

// Check payment status
router.get('/status/:reference', protect, async (req, res) => {
    try {
        const payment = await Payment.findOne({ 
            reference: req.params.reference,
            user: req.user.id
        });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        if (payment.status === 'successful') {
            return res.status(200).json({
                success: true,
                status: 'successful',
                postId: payment.post
            });
        }

        // If payment is still pending, verify with Paystack
        const verificationResponse = await paystack.get(`/transaction/verify/${payment.reference}`);
        const paymentData = verificationResponse.data.data;

        if (paymentData.status === 'success' && payment.status !== 'successful') {
            // Update payment record
            payment.status = 'successful';
            payment.paidAt = new Date(paymentData.paid_at);
            payment.channel = paymentData.channel;
            payment.currency = paymentData.currency;
            payment.ipAddress = paymentData.ip_address;
            await payment.save();

            // Grant user access to the post
            await Post.findByIdAndUpdate(payment.post, {
                $addToSet: { purchasedBy: req.user.id }
            });

            return res.status(200).json({
                success: true,
                status: 'successful',
                postId: payment.post
            });
        }

        res.status(200).json({
            success: true,
            status: paymentData.status || payment.status,
            authorizationUrl: payment.authorizationUrl
        });

    } catch (error) {
        console.error('Payment status check error:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            message: error.response?.data?.message || 'Failed to check payment status' 
        });
    }
});

module.exports = router;