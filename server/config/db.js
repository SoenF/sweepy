const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sweepy';
        console.log('🔍 Attempting MongoDB connection...');
        console.log('🔍 MONGODB_URI is defined:', !!process.env.MONGODB_URI);
        console.log('🔍 Connection URI format:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database Name: ${conn.connection.db.databaseName}`);
        console.log(`🔌 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    } catch (err) {
        console.error(`❌ MongoDB Connection Error: ${err.message}`);
        console.error("Please ensure MONGODB_URI is set in .env or a local mongo instance is running.");
    }
};

// Add connection event listeners for debugging
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected event fired');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected');
});

module.exports = connectDB;
