const Form = require('../models/Form');
const User = require('../models/User');
const googleFormsService = require('../services/googleFormsService');
const googleSheetsService = require('../services/googleSheetsService');
const groqAIService = require('../services/groqAIService');

/**
 * Form Controller
 * Handles CRUD operations, form creation via Google Forms API,
 * response syncing, duplication, and smart link validation.
 */

/**
 * POST /api/forms/create
 * Creates a Google Form and stores metadata in MongoDB.
 */
const createForm = async (req, res) => {
    const { title, description, questions, config, themeColor } = req.body;
    const userId = req.userId;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.accessToken) {
            return res.status(401).json({
                message: 'No Google access token. Please log in again.',
                error: 'AUTH_EXPIRED',
            });
        }

        // Create Google Form
        const googleForm = await googleFormsService.createForm(user, {
            title,
            description,
            questions: questions || [],
        });

        // Create sheet for responses
        let sheetData = { spreadsheetId: null, spreadsheetUrl: '' };
        try {
            sheetData = await googleSheetsService.createResponseSheet(user, title);
        } catch (sheetErr) {
            console.error('Sheet creation failed (non-fatal):', sheetErr.message);
        }

        // Parse config
        const startDate = config?.startDate ? new Date(config.startDate) : null;
        if (startDate) startDate.setHours(0, 0, 0, 0);

        const expiryDate = config?.expiryDate ? new Date(config.expiryDate) : null;
        if (expiryDate) expiryDate.setHours(23, 59, 59, 999);

        const responseLimit = config?.responseLimit ? parseInt(config.responseLimit) : 0;

        // Save to MongoDB
        const form = new Form({
            userId,
            googleFormId: googleForm.formId,
            googleSheetId: sheetData.spreadsheetId,
            formTitle: title || 'AI Generated Form',
            formDescription: description || '',
            prompt: config?.prompt || '',
            sections: config?.sections || [],
            themeColor: themeColor || '#3b82f6',
            startDate,
            expiryDate,
            responseLimit,
            publicUrl: googleForm.publicUrl,
            editUrl: googleForm.editUrl,
            sheetUrl: sheetData.spreadsheetUrl || '',
            timeEstimate: Math.ceil((questions || []).length * 0.5),
        });

        await form.save();

        res.status(201).json(form);
    } catch (error) {
        console.error('Create Form Error:', error.message);

        if (error.message?.includes('invalid_grant') || error.code === 401) {
            return res.status(401).json({
                message: 'Google session expired. Please log out and log in again.',
                error: 'AUTH_EXPIRED',
            });
        }

        res.status(500).json({ message: 'Failed to create form', error: error.message });
    }
};

/**
 * GET /api/forms
 * Lists all forms for the authenticated user.
 */
const getUserForms = async (req, res) => {
    try {
        const forms = await Form.find({ userId: req.userId }).sort({ createdAt: -1 });

        const now = new Date();
        const enrichedForms = forms.map((form) => {
            const obj = form.toObject();
            obj.isExpired = form.expiryDate && new Date(form.expiryDate) < now;
            obj.isLimitReached = form.responseLimit > 0 && form.respondentCount >= form.responseLimit;
            return obj;
        });

        res.json(enrichedForms);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch forms', error: error.message });
    }
};

/**
 * GET /api/forms/:id
 * Gets a single form by ID.
 */
const getFormById = async (req, res) => {
    try {
        const form = await Form.findOne({ _id: req.params.id, userId: req.userId });
        if (!form) return res.status(404).json({ message: 'Form not found' });
        res.json(form);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch form', error: error.message });
    }
};

/**
 * PUT /api/forms/:id/update
 * Updates form metadata (title, description, expiry, limit, theme).
 */
const updateForm = async (req, res) => {
    try {
        const allowedUpdates = ['formTitle', 'formDescription', 'expiryDate', 'responseLimit', 'themeColor', 'status'];
        const updates = {};

        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        const form = await Form.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            updates,
            { new: true, runValidators: true }
        );

        if (!form) return res.status(404).json({ message: 'Form not found' });

        res.json(form);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update form', error: error.message });
    }
};

/**
 * DELETE /api/forms/:id
 * Deletes a form from MongoDB (does not delete Google Form).
 */
const deleteForm = async (req, res) => {
    try {
        const form = await Form.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!form) return res.status(404).json({ message: 'Form not found' });
        res.json({ message: 'Form deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete form', error: error.message });
    }
};

/**
 * POST /api/forms/:id/sync
 * Syncs responses from Google Forms to Google Sheets.
 */
const syncResponses = async (req, res) => {
    try {
        const form = await Form.findOne({ _id: req.params.id, userId: req.userId });
        if (!form) return res.status(404).json({ message: 'Form not found' });

        const user = await User.findById(form.userId);
        if (!user || !user.accessToken) {
            return res.status(401).json({ message: 'Authorization required' });
        }

        // Fetch responses from Google Forms
        const { form: formData, responses } = await googleFormsService.getFormResponses(
            user,
            form.googleFormId
        );

        // Sync to Google Sheets
        const sheetUrl = await googleSheetsService.syncResponsesToSheet(
            user,
            form,
            formData,
            responses
        );

        res.json({
            url: sheetUrl,
            responseCount: responses.length,
            message: `${responses.length} response(s) synced successfully`,
        });
    } catch (error) {
        console.error('Sync Error:', error.message);
        res.status(500).json({ message: 'Failed to sync responses', error: error.message });
    }
};

/**
 * POST /api/forms/:id/duplicate
 * Duplicates a form (both Google Form and MongoDB record).
 */
const duplicateFormHandler = async (req, res) => {
    try {
        const original = await Form.findOne({ _id: req.params.id, userId: req.userId });
        if (!original) return res.status(404).json({ message: 'Form not found' });

        const user = await User.findById(req.userId);
        if (!user || !user.accessToken) {
            return res.status(401).json({ message: 'Authorization required' });
        }

        const newTitle = `Copy of ${original.formTitle}`;
        const googleForm = await googleFormsService.duplicateForm(
            user,
            original.googleFormId,
            newTitle
        );

        const newForm = new Form({
            userId: req.userId,
            googleFormId: googleForm.formId,
            formTitle: newTitle,
            formDescription: original.formDescription,
            prompt: original.prompt,
            sections: original.sections,
            themeColor: original.themeColor,
            expiryDate: original.expiryDate,
            responseLimit: original.responseLimit,
            publicUrl: googleForm.publicUrl,
            editUrl: googleForm.editUrl,
            timeEstimate: original.timeEstimate,
        });

        await newForm.save();
        res.status(201).json(newForm);
    } catch (error) {
        console.error('Duplicate Error:', error.message);
        res.status(500).json({ message: 'Failed to duplicate form', error: error.message });
    }
};

/**
 * GET /api/forms/:id/expand/suggestions
 * Returns AI-generated contextual suggestions for expanding the form.
 */
const getExpandSuggestions = async (req, res) => {
    try {
        const form = await Form.findOne({ _id: req.params.id, userId: req.userId });
        if (!form) return res.status(404).json({ message: 'Form not found' });

        const suggestions = await groqAIService.generateExpandSuggestions(form.formTitle);
        res.json({ suggestions });
    } catch (error) {
        console.error('Expand Suggestions Error:', error);
        res.status(500).json({ message: 'Failed to generate suggestions', error: error.message });
    }
};

/**
 * POST /api/forms/:id/expand/generate
 * Generates new questions via AI for preview. Does NOT save to Google Forms yet.
 */
const generateExpandPreview = async (req, res) => {
    const { prompt, language } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        const form = await Form.findOne({ _id: req.params.id, userId: req.userId });
        if (!form) return res.status(404).json({ message: 'Form not found' });

        // Generate new questions via AI
        const questions = await groqAIService.generateExpandQuestions(
            form.formTitle,
            prompt,
            language || 'English'
        );

        res.json({
            message: 'Preview generated',
            questions,
        });
    } catch (error) {
        console.error('Generate Expand Preview Error:', error.message);
        res.status(500).json({ message: 'Failed to generate preview', error: error.message });
    }
};

/**
 * POST /api/forms/:id/expand/apply
 * Applies the verified, edited questions to the actual Google Form.
 */
const applyExpandQuestions = async (req, res) => {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: 'Valid questions array is required' });
    }

    try {
        const form = await Form.findOne({ _id: req.params.id, userId: req.userId });
        if (!form) return res.status(404).json({ message: 'Form not found' });

        const user = await User.findById(req.userId);
        if (!user || !user.accessToken) {
            return res.status(401).json({ message: 'Authorization required' });
        }

        // Append to Google Form
        const totalItems = await googleFormsService.appendQuestions(
            user,
            form.googleFormId,
            questions
        );

        // Update time estimate
        form.timeEstimate = Math.ceil(totalItems * 0.5);
        await form.save();

        res.json({
            message: 'Form expanded successfully',
            questionsAdded: questions.length,
            timeEstimate: form.timeEstimate,
        });
    } catch (error) {
        console.error('Apply Expand Questions Error:', error.message);
        if (error.message?.includes('invalid_grant') || error.code === 401) {
            return res.status(401).json({
                message: 'Google session expired. Please log in again.',
                error: 'AUTH_EXPIRED',
            });
        }
        res.status(500).json({ message: 'Failed to expand form', error: error.message });
    }
};

/**
 * POST /api/forms/:id/close
 * Closes a form (sets status to closed, expires immediately).
 */
const closeForm = async (req, res) => {
    try {
        const form = await Form.findOne({ _id: req.params.id, userId: req.userId });
        if (!form) return res.status(404).json({ message: 'Form not found' });

        form.status = 'closed';
        form.expiryDate = new Date();
        await form.save();

        res.json({ message: 'Form closed successfully', form });
    } catch (error) {
        res.status(500).json({ message: 'Failed to close form', error: error.message });
    }
};

/**
 * POST /api/forms/:id/reactivate
 * Reactivates an expired form for 7 more days.
 */
const reactivateForm = async (req, res) => {
    try {
        const form = await Form.findOne({ _id: req.params.id, userId: req.userId });
        if (!form) return res.status(404).json({ message: 'Form not found' });

        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 7);
        newExpiry.setHours(23, 59, 59, 999);

        form.expiryDate = newExpiry;
        form.status = 'active';
        await form.save();

        res.json(form);
    } catch (error) {
        res.status(500).json({ message: 'Failed to reactivate form', error: error.message });
    }
};

module.exports = {
    createForm,
    getUserForms,
    getFormById,
    updateForm,
    deleteForm,
    syncResponses,
    duplicateFormHandler,
    getExpandSuggestions,
    generateExpandPreview,
    applyExpandQuestions,
    closeForm,
    reactivateForm,
};
