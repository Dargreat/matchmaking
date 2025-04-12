const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['FWB', 'HOOKUP', 'RELATIONSHIP', 'GENERAL'],
    },
    imageUrl: {
        type: String,
        required: true
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    price: {
        type: Number,
        default: 5000, // ₦5,000 in kobo
        required: true
    },
    purchasedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('Post', PostSchema);