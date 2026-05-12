const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter — 100 requests per 15 minutes.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        message: 'Too many requests. Please try again later.',
        error: 'RATE_LIMITED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Stricter rate limiter for AI generation endpoints — 10 requests per 15 minutes.
 */
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        message: 'AI generation rate limit reached. Please wait before trying again.',
        error: 'AI_RATE_LIMITED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Auth rate limiter — 20 requests per 15 minutes.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        message: 'Too many authentication attempts.',
        error: 'AUTH_RATE_LIMITED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { apiLimiter, aiLimiter, authLimiter };
