const { google } = require('googleapis');
const { createOAuth2Client } = require('../config/oauth');

/**
 * Google Sheets Service
 * Handles spreadsheet creation and response syncing.
 */

/**
 * Creates a new spreadsheet for storing form responses.
 * @param {Object} user - User with OAuth tokens
 * @param {string} title - Spreadsheet title
 * @returns {Object} { spreadsheetId, spreadsheetUrl }
 */
const createResponseSheet = async (user, title) => {
    const auth = createOAuth2Client();
    auth.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const res = await sheets.spreadsheets.create({
        requestBody: {
            properties: { title: `${title} - Responses` },
        },
    });

    return {
        spreadsheetId: res.data.spreadsheetId,
        spreadsheetUrl: res.data.spreadsheetUrl,
    };
};

/**
 * Syncs form responses to a Google Sheet.
 * Creates the sheet if it doesn't exist, then writes all response data.
 * @param {Object} user - User with OAuth tokens
 * @param {Object} formDoc - Form MongoDB document
 * @param {Object} formData - Raw Google Form data (with items)
 * @param {Array} responses - Array of response objects from Google Forms API
 * @returns {string} Sheet URL
 */
const syncResponsesToSheet = async (user, formDoc, formData, responses) => {
    const auth = createOAuth2Client();
    auth.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
    });

    const sheetsApi = google.sheets({ version: 'v4', auth });

    // Lazy-create spreadsheet if needed
    let sheetId = formDoc.googleSheetId;
    if (!sheetId) {
        const sheetResult = await createResponseSheet(user, formDoc.formTitle);
        sheetId = sheetResult.spreadsheetId;
        formDoc.googleSheetId = sheetId;
        formDoc.sheetUrl = sheetResult.spreadsheetUrl;
    }

    // Build headers from form questions
    const items = formData.items || [];
    const questionMap = {};
    const headers = ['Timestamp', 'Response ID'];

    items.forEach((item) => {
        if (item.questionItem) {
            headers.push(item.title);
            questionMap[item.questionItem.question.questionId] = item.title;
        }
    });

    // Build data rows
    const rows = [headers];
    responses.forEach((resp) => {
        const row = [resp.createTime, resp.responseId];
        const answerMap = resp.answers || {};

        items.forEach((item) => {
            if (item.questionItem) {
                const qId = item.questionItem.question.questionId;
                const ans = answerMap[qId];
                let val = '';
                if (ans && ans.textAnswers && ans.textAnswers.answers) {
                    val = ans.textAnswers.answers.map((a) => a.value).join(', ');
                }
                row.push(val);
            }
        });

        rows.push(row);
    });

    // Write to sheet
    await sheetsApi.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: { values: rows },
    });

    // Update form document
    formDoc.respondentCount = responses.length;
    formDoc.lastSyncedAt = new Date();
    await formDoc.save();

    return formDoc.sheetUrl || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
};

module.exports = {
    createResponseSheet,
    syncResponsesToSheet,
};
