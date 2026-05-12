const mongoose = require('mongoose');

/**
 * User Schema
 * Stores Google OAuth profile data and tokens.
 * Tokens are used to interact with Google APIs on behalf of the user.
 */
const UserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        default: '',
    },
    accessToken: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
    },

    // ── Subscription ────────────────────────────
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'monthly', 'yearly'],
            default: 'free',
        },
        stripeCustomerId: { type: String, default: null },
        stripeSubscriptionId: { type: String, default: null },
        currentPeriodEnd: { type: Date, default: null },
        status: {
            type: String,
            enum: ['active', 'canceled', 'past_due', 'none'],
            default: 'none',
        },
    },
}, {
    timestamps: true, // createdAt, updatedAt
});

module.exports = mongoose.model('User', UserSchema);
