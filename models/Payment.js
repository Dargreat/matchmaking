const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'successful', 'failed', 'abandoned'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'bank_transfer', 'ussd', 'mobile_money', null],
        default: null
    },
    authorizationUrl: {
        type: String,
        required: true
    },
    channel: {
        type: String
    },
    currency: {
        type: String,
        default: 'NGN'
    },
    ipAddress: {
        type: String
    },
    paidAt: {
        type: Date
    },
    paystackId: {
        type: String // Stores Paystack transaction ID for reference
    },
    retryCount: {
        type: Number,
        default: 0
    },
    metadata: {
        type: Object // Store any additional payment data
    }
}, {
    timestamps: true
});

// Index for faster queries
PaymentSchema.index({ user: 1, post: 1, status: 1 });
PaymentSchema.index({ reference: 1 });
PaymentSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);