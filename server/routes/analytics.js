const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { getAnalytics, exportCSV } = require('../controllers/analyticsController');

/**
 * Analytics Routes (all protected)
 */

router.get('/:id/analytics', authenticate, apiLimiter, getAnalytics);
router.get('/:id/export', authenticate, apiLimiter, exportCSV);

module.exports = router;
