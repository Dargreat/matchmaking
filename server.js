require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');
const serverless = require('serverless-http'); // Required for Vercel

// Connect to DB and start server (for local dev)
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    try {
      await connectDB();
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
    } catch (err) {
      console.error('❌ Server failed to start:', err);
      process.exit(1);
    }
  })();
}

// Export for Vercel (must be serverless-http wrapped)
module.exports = serverless(app);