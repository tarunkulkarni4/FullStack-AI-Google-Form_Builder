const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
    createCheckoutSession,
    handleWebhook,
    getSubscriptionStatus,
    verifySession,
    cancelSubscription,
    debugReset,
    getPaymentHistory,
} = require('../controllers/subscriptionController');

// Stripe webhook must use raw body — registered BEFORE json middleware in server.js
router.post('/webhook', handleWebhook);

// Protected endpoints
router.get('/status', authenticate, apiLimiter, getSubscriptionStatus);
router.get('/history', authenticate, apiLimiter, getPaymentHistory);
router.get('/verify-session', authenticate, apiLimiter, verifySession);
router.post('/create-checkout', authenticate, apiLimiter, createCheckoutSession);
router.post('/cancel', authenticate, apiLimiter, cancelSubscription);
router.post('/debug-reset', authenticate, debugReset);

module.exports = router;
