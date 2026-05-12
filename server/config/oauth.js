const { google } = require('googleapis');

/**
 * Creates a fresh OAuth2 client instance.
 * Each request should get its own client to avoid token conflicts.
 */
const createOAuth2Client = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
    );
};

/**
 * OAuth2 scopes required by the application.
 * - userinfo: profile + email for login
 * - forms: create and manage Google Forms
 * - drive.file: manage files created by the app
 * - spreadsheets: sync responses to Google Sheets
 */
const SCOPES = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/forms.body',
    'https://www.googleapis.com/auth/forms.responses.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
];

module.exports = { createOAuth2Client, SCOPES };
