const { google } = require('googleapis');
const { createOAuth2Client } = require('../config/oauth');

/**
 * Google Forms Service
 * Handles creation, modification, and response fetching via Google Forms API.
 */

/**
 * Converts question type string to Google Forms API question object.
 */
const buildQuestion = (type, options = []) => {
    switch (type) {
        case 'paragraph':
            return { textQuestion: { paragraph: true } };
        case 'multiple_choice':
            return { choiceQuestion: { type: 'RADIO', options: options.map(v => ({ value: v })) } };
        case 'checkbox':
            return { choiceQuestion: { type: 'CHECKBOX', options: options.map(v => ({ value: v })) } };
        case 'dropdown':
            return { choiceQuestion: { type: 'DROP_DOWN', options: options.map(v => ({ value: v })) } };
        case 'scale':
            return { scaleQuestion: { low: 1, high: 5, lowLabel: 'Poor', highLabel: 'Excellent' } };
        default: // short_answer
            return { textQuestion: { paragraph: false } };
    }
};

/**
 * Builds Google Forms batchUpdate request items from questions array.
 * @param {Array} questions - Array of { title, type, options } objects
 * @returns {Array} Google Forms API createItem requests
 */
const buildBatchRequests = (questions) => {
    return questions.map((q, i) => ({
        createItem: {
            item: {
                title: q.title || 'Untitled Question',
                questionItem: {
                    question: {
                        required: q.required !== undefined ? q.required : true,
                        ...buildQuestion(q.type, q.options || []),
                    },
                },
            },
            location: { index: i },
        },
    }));
};

/**
 * Creates a Google Form with the given title and questions.
 * @param {Object} user - User document with accessToken and refreshToken
 * @param {Object} formData - { title, description, questions }
 * @returns {Object} { formId, publicUrl, editUrl }
 */
const createForm = async (user, formData) => {
    const auth = createOAuth2Client();
    auth.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
    });

    // Auto-refresh tokens
    auth.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            user.accessToken = tokens.access_token;
            if (tokens.refresh_token) user.refreshToken = tokens.refresh_token;
            await user.save();
        }
    });

    const forms = google.forms({ version: 'v1', auth });

    // 1. Create blank form
    const createRes = await forms.forms.create({
        requestBody: { info: { title: formData.title || 'AI Generated Form' } },
    });

    const formId = createRes.data.formId;

    // 2. Build batch requests
    const batchRequests = [];

    // Set description
    if (formData.description) {
        batchRequests.push({
            updateFormInfo: {
                info: { description: formData.description },
                updateMask: 'description',
            },
        });
    }

    // Add questions
    const questionRequests = buildBatchRequests(formData.questions || []);
    batchRequests.push(...questionRequests);

    // 3. Execute batch update
    if (batchRequests.length > 0) {
        await forms.forms.batchUpdate({
            formId,
            requestBody: { requests: batchRequests },
        });
    }

    return {
        formId,
        publicUrl: createRes.data.responderUri,
        editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
    };
};

/**
 * Appends new questions to an existing Google Form.
 */
const appendQuestions = async (user, googleFormId, questions) => {
    const auth = createOAuth2Client();
    auth.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
    });

    auth.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            user.accessToken = tokens.access_token;
            if (tokens.refresh_token) user.refreshToken = tokens.refresh_token;
            await user.save();
        }
    });

    const formsApi = google.forms({ version: 'v1', auth });

    // Get current item count for correct indexing
    const currentForm = await formsApi.forms.get({ formId: googleFormId });
    const currentItemCount = (currentForm.data.items || []).length;

    const requests = questions.map((q, i) => ({
        createItem: {
            item: {
                title: q.title || 'Untitled Question',
                questionItem: {
                    question: {
                        required: q.required !== undefined ? q.required : true,
                        ...buildQuestion(q.type, q.options || []),
                    },
                },
            },
            location: { index: currentItemCount + i },
        },
    }));

    await formsApi.forms.batchUpdate({
        formId: googleFormId,
        requestBody: { requests },
    });

    // Return updated item count for time estimate
    const updatedForm = await formsApi.forms.get({ formId: googleFormId });
    return (updatedForm.data.items || []).length;
};

/**
 * Fetches form responses from Google Forms API.
 */
const getFormResponses = async (user, googleFormId) => {
    const auth = createOAuth2Client();
    auth.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
    });

    const formsApi = google.forms({ version: 'v1', auth });

    const [formData, responseData] = await Promise.all([
        formsApi.forms.get({ formId: googleFormId }),
        formsApi.forms.responses.list({ formId: googleFormId }),
    ]);

    return {
        form: formData.data,
        responses: responseData.data.responses || [],
    };
};

/**
 * Duplicates a Google Form by cloning its questions into a new form.
 */
const duplicateForm = async (user, originalGoogleFormId, newTitle) => {
    const auth = createOAuth2Client();
    auth.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
    });

    auth.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            user.accessToken = tokens.access_token;
            if (tokens.refresh_token) user.refreshToken = tokens.refresh_token;
            await user.save();
        }
    });

    const formsApi = google.forms({ version: 'v1', auth });

    // Fetch original
    const originalForm = await formsApi.forms.get({ formId: originalGoogleFormId });
    const items = originalForm.data.items || [];

    // Create new form
    const createRes = await formsApi.forms.create({
        requestBody: { info: { title: newTitle } },
    });
    const newFormId = createRes.data.formId;

    // Clone questions
    if (items.length > 0) {
        const requests = items.map((item, i) => {
            const req = {
                createItem: {
                    item: { title: item.title || '' },
                    location: { index: i },
                },
            };
            if (item.questionItem) req.createItem.item.questionItem = item.questionItem;
            if (item.textItem) req.createItem.item.textItem = item.textItem;
            return req;
        });

        await formsApi.forms.batchUpdate({
            formId: newFormId,
            requestBody: { requests },
        });
    }

    return {
        formId: newFormId,
        publicUrl: createRes.data.responderUri,
        editUrl: `https://docs.google.com/forms/d/${newFormId}/edit`,
    };
};

module.exports = {
    createForm,
    appendQuestions,
    getFormResponses,
    duplicateForm,
    buildBatchRequests,
    buildQuestion,
};
