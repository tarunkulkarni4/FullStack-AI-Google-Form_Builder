const groqAIService = require('../services/groqAIService');
const googleFormsService = require('../services/googleFormsService');

/**
 * AI Controller
 * Handles AI-powered form generation endpoints.
 */

/**
 * POST /api/forms/generate-ai
 * Step 1: Analyzes user's prompt and suggests form sections.
 */
const analyzeIntent = async (req, res) => {
    const { prompt, language } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        const suggestions = await groqAIService.analyzeIntent(prompt, language || 'English');
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
    const { prompt, sections, language } = req.body;

    if (!prompt || !sections) {
        return res.status(400).json({ message: 'Prompt and sections are required' });
    }

    try {
        const { questions, themeColor, timeEstimate } = await groqAIService.generateFormStructure(
            prompt,
            sections,
            language || 'English'
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
