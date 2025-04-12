const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/auth');
const User = require('../models/User');

// Get all users (admin only)
router.get('/users', adminProtect, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;