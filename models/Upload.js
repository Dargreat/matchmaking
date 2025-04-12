const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['HOOKUP', 'FWB', 'RELATIONSHIP'],
        required: true,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Upload', uploadSchema);