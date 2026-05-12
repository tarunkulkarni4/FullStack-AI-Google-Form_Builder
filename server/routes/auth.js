const router = require('express').Router();
const { googleAuth, googleCallback, getProfile, logout } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * Auth Routes
 * POST /api/auth/google          → Redirect to Google OAuth
 * GET  /api/auth/google/callback → OAuth callback handler
 * GET  /api/auth/profile         → Get current user profile
 * POST /api/auth/logout          → Clear session
 */

router.get('/google', authLimiter, googleAuth);
router.get('/google/callback', googleCallback);
router.get('/profile', getProfile);
router.post('/logout', logout);

module.exports = router;
