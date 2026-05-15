const aiServiceRouter = require('../services/aiServiceRouter');
const googleFormsService = require('../services/googleFormsService');

/**
 * AI Controller
 * Handles AI-powered form generation endpoints.
 * Supports model selection via the `aiModel` field in request body.
 */

/**
 * POST /api/forms/generate-ai
 * Step 1: Analyzes user's prompt and suggests form sections.
 */
const analyzeIntent = async (req, res) => {
    const { prompt, language, aiModel } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        const suggestions = await aiServiceRouter.analyzeIntent(
            prompt,
            language || 'English',
            aiModel || 'grok'
        );
        res.json(suggestions);
    } catch (error) {
        console.error('AI Intent Analysis Error:', error.message);
        res.status(500).json({
            message: 'Failed to analyze intent',
            error: error.message,
        });
    }
};

/**
 * POST /api/forms/generate-structure
 * Step 2: Generates full form structure from selected sections.
 * Returns Google Forms API batch requests ready for creation.
 */
const generateFormStructure = async (req, res) => {
    const { prompt, sections, language, aiModel } = req.body;

    if (!prompt || !sections) {
        return res.status(400).json({ message: 'Prompt and sections are required' });
    }

    try {
        const { questions, themeColor, timeEstimate } = await aiServiceRouter.generateFormStructure(
            prompt,
            sections,
            language || 'English',
            aiModel || 'grok'
        );

        // Build Google Forms API requests
        const requests = googleFormsService.buildBatchRequests(questions);

        res.json({ requests, questions, themeColor, timeEstimate });
    } catch (error) {
        console.error('AI Structure Generation Error:', error.message);
        res.status(500).json({
            message: 'Failed to generate form structure',
            error: error.message,
        });
    }
};

module.exports = { analyzeIntent, generateFormStructure };
