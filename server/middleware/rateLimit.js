const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter for Authentication Routes
 * Prevents brute force attacks on login/signup
 * Limit: 20 requests per 15 minutes per IP
 */
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    message: {
        error: 'Too many authentication attempts',
        message: 'Please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip successful requests in some cases
    skipSuccessfulRequests: false,
    // Handler for when limit is exceeded
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many requests',
            message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
            retryAfter: Math.ceil(req.rateLimit.resetTime - Date.now() / 1000)
        });
    }
});

/**
 * Rate Limiter for Sync Routes
 * Prevents API abuse on data sync endpoints
 * Limit: 100 requests per 15 minutes per IP
 */
const syncRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many sync requests',
        message: 'Please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many requests',
            message: 'Too many sync requests from this IP, please try again after 15 minutes',
            retryAfter: Math.ceil(req.rateLimit.resetTime - Date.now() / 1000)
        });
    }
});

/**
 * General API Rate Limiter
 * Can be used for other routes as needed
 * Limit: 200 requests per 15 minutes per IP
 */
const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: {
        error: 'Too many requests',
        message: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    authRateLimiter,
    syncRateLimiter,
    generalRateLimiter
};
