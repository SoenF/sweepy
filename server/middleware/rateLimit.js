/**
 * Rate limiting and security middleware for mobile sync endpoints
 */

const rateLimit = require('express-rate-limit');

// Rate limiter for sync endpoints - more generous for mobile apps
const syncRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many sync requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// More restrictive rate limiter for auth endpoints
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware to check if request is from mobile app
const mobileCheckMiddleware = (req, res, next) => {
  // Check for common mobile headers or custom headers
  const userAgent = req.get('User-Agent') || '';
  const isMobile = userAgent.toLowerCase().includes('mobile') || 
                  req.get('X-Requested-With') === 'XMLHttpRequest' ||
                  req.get('X-Mobile-App');
  
  // Add flag to request object
  req.isMobile = isMobile;
  next();
};

module.exports = {
  syncRateLimiter,
  authRateLimiter,
  mobileCheckMiddleware
};