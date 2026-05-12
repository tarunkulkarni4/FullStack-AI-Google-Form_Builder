const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createOAuth2Client, SCOPES } = require('../config/oauth');

/**
 * Auth Controller
 * Handles Google OAuth 2.0 flow: redirect, callback, profile, logout.
 */

/**
 * GET /api/auth/google
 * Redirects user to Google's OAuth consent screen.
 */
const googleAuth = (req, res) => {
    const oauth2Client = createOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    });
    res.redirect(url);
};

/**
 * GET /api/auth/google/callback
 * Handles the OAuth callback, exchanges code for tokens,
 * creates/updates user, issues JWT, redirects to frontend.
 */
const googleCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect(`${process.env.CLIENT_URL}/?error=no_code`);
    }

    try {
        const oauth2Client = createOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch user profile
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();

        // Upsert user
        let user = await User.findOne({ googleId: data.id });

        if (!user) {
            user = new User({
                googleId: data.id,
                name: data.name,
                email: data.email,
                profilePicture: data.picture || '',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
            });
        } else {
            user.accessToken = tokens.access_token;
            user.name = data.name;
            user.profilePicture = data.picture || user.profilePicture;
            if (tokens.refresh_token) {
                user.refreshToken = tokens.refresh_token;
            }
        }

        await user.save();

        // Issue JWT (7-day expiry)
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    } catch (error) {
        console.error('Auth Callback Error:', error.message);
        res.redirect(`${process.env.CLIENT_URL}/?error=auth_failed`);
    }
};

/**
 * GET /api/auth/profile
 * Returns the current authenticated user's profile.
 */
const getProfile = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-accessToken -refreshToken');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

/**
 * POST /api/auth/logout
 * Clears the auth cookie.
 */
const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.json({ message: 'Logged out successfully' });
};

module.exports = { googleAuth, googleCallback, getProfile, logout };
