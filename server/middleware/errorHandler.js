/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns consistent JSON responses.
 */
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);

    if (process.env.NODE_ENV === 'development') {
        console.error('Stack:', err.stack);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            message: 'Validation Error',
            errors: messages,
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        return res.status(409).json({
            message: 'Duplicate entry detected.',
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            message: 'Invalid ID format.',
        });
    }

    // Google API errors
    if (err.response && err.response.data) {
        return res.status(err.response.status || 500).json({
            message: 'Google API Error',
            error: err.response.data.error?.message || err.message,
        });
    }

    // Default server error
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = { errorHandler };
