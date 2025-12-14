const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches family_id to request
 * Used to protect all family-specific routes
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'No token provided'
            });
        }

        // Extract token (format: "Bearer TOKEN")
        const token = authHeader.substring(7);

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach family_id to request for use in controllers
        req.family_id = decoded.family_id;
        req.token = decoded; // Store full decoded token if needed

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Please login again'
            });
        }

        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Authentication failed'
            });
        }

        // Other errors
        console.error('Auth middleware error:', err);
        return res.status(500).json({
            error: 'Authentication error',
            message: 'Internal server error'
        });
    }
};

module.exports = authMiddleware;
