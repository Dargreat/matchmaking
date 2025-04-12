const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
const protect = async (req, res, next) => {
    let token;
    
    if (req?.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req?.cookies?.token) {
        token = req.cookies.token;
    }
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ success: false, message: 'Not authorized' });
    }
};

// Admin only
const adminProtect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
        token = req.cookies.token;
    }
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized as admin' });
        }
        
        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ success: false, message: 'Not authorized' });
    }
};

module.exports = { protect, adminProtect };