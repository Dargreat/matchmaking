const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const { protect } = require('../middleware/auth');

// Get matches by category
router.get('/', protect, async (req, res) => {
    try {
        const { category } = req.query;
        if (!category || !['HOOKUP', 'FWB', 'RELATIONSHIP'].includes(category)) {
            return res.status(400).json({ success: false, message: 'Invalid category' });
        }

        const matches = await Match.find({ category, isActive: true });
        res.json({ success: true, matches });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Create a new match (admin only)
router.post('/', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { name, age, location, category, imageUrl, description } = req.body;
        const match = new Match({ name, age, location, category, imageUrl, description });
        await match.save();

        res.status(201).json({ success: true, match });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;