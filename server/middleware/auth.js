const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Authentication Middleware
 * Validates the token from cookies and attaches user to request.
 */
const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: 'Authentication required. Please log in.',
                error: 'NO_TOKEN',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: 'User not found. Please log in again.',
                error: 'USER_NOT_FOUND',
            });
        }

        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Session expired. Please log in again.',
                error: 'TOKEN_EXPIRED',
            });
        }
        return res.status(401).json({
            message: 'Invalid authentication token.',
            error: 'INVALID_TOKEN',
        });
    }
};

module.exports = { authenticate };
