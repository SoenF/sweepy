const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Use Mongoose connection
const dotenv = require('dotenv');
const { syncRateLimiter, authRateLimiter } = require('./middleware/rateLimit');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - Required for Render deployment and rate limiting
app.set('trust proxy', 1);

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'https://homeflow-f54h.onrender.com',
            process.env.FRONTEND_URL
        ].filter(Boolean); // Remove undefined values

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(null, true); // For now, allow all to debug
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Apply rate limiting to specific routes
app.use('/api/auth/', authRateLimiter); // Apply to auth routes
app.use('/api/sync/', syncRateLimiter); // Apply to sync routes

app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/chores', require('./routes/chores'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/sync', require('./routes/sync'));

// Basic route
app.get('/', (req, res) => {
    res.send('Sweepy API is running with MongoDB');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
