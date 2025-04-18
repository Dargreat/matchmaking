require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');

// Connect to database and start the server
const startServer = async () => {
    try {
        await connectDB(); // Connect to MongoDB
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error starting server:', error);
        process.exit(1); // Exit process with failure
    }
};

startServer();