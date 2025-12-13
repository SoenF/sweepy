const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sweepy');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        // Do not exit process in dev, just log. In prod it might restart.
        console.error("Please ensure MONGODB_URI is set in .env or a local mongo instance is running.");
    }
};

module.exports = connectDB;
