const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['HOOKUP', 'FWB', 'RELATIONSHIP'],
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Match', matchSchema);