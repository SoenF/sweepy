const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sweepy';
        console.log('🔍 Attempting MongoDB connection...');
        console.log('🔍 MONGODB_URI is defined:', !!process.env.MONGODB_URI);
        console.log('🔍 Connection URI format:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ MongoDB Connection Error: ${err.message}`);
        console.error("Please ensure MONGODB_URI is set in .env or a local mongo instance is running.");
    }
};

module.exports = connectDB;
