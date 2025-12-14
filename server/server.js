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

// CORS configuration for web and mobile apps
const corsOptions = {
    origin: '*', // Allow ALL origins for mobile compatibility
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Type', 'Accept', 'X-Requested-With'],
    credentials: false // Disable credentials to allow wildcard origin
};

app.use(cors(corsOptions));

app.use(express.json());

// Handle preflight requests explicitly
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, X-Client-Type');
    // res.header('Access-Control-Allow-Credentials', 'true'); // DISABLED
    res.sendStatus(200);
});

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
