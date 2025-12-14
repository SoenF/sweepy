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

// CORS configuration for web and mobile apps
const corsOptions = {
    origin: function(origin, callback) {
        // For mobile apps and WebView, the origin is often null or undefined
        // Sometimes it's an empty string or even the string "null"
        if (!origin || origin === 'null' || origin === 'undefined') return callback(null, true);

        // Allow localhost variations for Capacitor development and WebView
        // This includes both http and https, as well as different port configurations
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);

        // Allow Capacitor/Cordova schemes
        if (origin.includes('capacitor://') || origin.includes('ionic://')) return callback(null, true);

        // Allow file:// protocol used in mobile apps
        if (origin.includes('file://')) return callback(null, true);

        // For production Capacitor apps, sometimes the origin might be your Render URL
        if (origin.includes('sweepy-backend.onrender.com')) return callback(null, true);

        // Additional check for common Capacitor configurations
        if (origin.includes('ionic://') || origin.includes('capacitor://')) return callback(null, true);

        // If we reach here, allow all origins for maximum compatibility during development
        // In production, you should restrict this to your specific domains
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'X-Client-Type',  // For identifying mobile vs web
        'X-Requested-With'
    ],
    optionsSuccessStatus: 200, // For legacy browser support
    preflightContinue: false
};

app.use(cors(corsOptions));

app.use(express.json());

// Handle preflight requests explicitly to ensure compatibility with Capacitor
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, X-Client-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
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
