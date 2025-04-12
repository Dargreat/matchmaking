require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const postRoutes = require('./routes/postRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/auth');
const morgan = require('morgan');
const User = require('./models/User');


const app = express();


// Middleware
app.use(cors()); // Enable CORS for frontend requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/payments', paymentRoutes);

// Add this to your routes
app.get('/payment-status', (req, res) => {
    res.sendFile(path.join(__dirname, './public/payment-status.html'));
});

// User({
//     name: "admin",
//     email: "admin@gmail.com",
//     password: "admin123",
//     role: "admin"
    
// }).save()
// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

module.exports = app;