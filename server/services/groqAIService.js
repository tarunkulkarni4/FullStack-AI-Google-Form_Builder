const { groqClient, GROQ_CONFIG } = require('../config/groqConfig');

/**
 * Groq AI Service
 * Handles all AI-powered form generation using Llama 3.3 70B.
 */

/**
 * Analyzes user's natural language prompt and suggests form sections.
 * @param {string} prompt - User's form description
 * @param {string} language - Target language for the form
 * @returns {Array} Suggested sections with descriptions and fields
 */
const analyzeIntent = async (prompt, language = 'English') => {
    const completion = await groqClient.chat.completions.create({
        model: GROQ_CONFIG.model,
        messages: [
            {
                role: 'system',
                content: `You are an expert Google Forms designer.
Analyze the user's request and suggest 4-6 relevant sections for a form.
Each suggestion must have: id (snake_case), title, description, and suggestedFields (array of 2-3 strings).
IMPORTANT: The first section MUST ALWAYS be for basic/personal details (e.g., Name, Email, Contact), unless explicitly told otherwise. Ensure all sections follow a strict, logical chronological sequence.
IMPORTANT: Write ALL text (title, description, suggestedFields) in ${language} language.
Return ONLY a valid JSON array. No markdown, no explanation, no code blocks.`,
            },
            { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content || '';
    return parseJSONArray(text);
};

/**
 * Generates complete form structure with questions from selected sections.
 * @param {string} prompt - Original user prompt
 * @param {Array} sections - Selected sections to generate questions for
 * @param {string} language - Target language
 * @returns {Object} { questions, themeColor, timeEstimate }
 */
const generateFormStructure = async (prompt, sections, language = 'English') => {
    const completion = await groqClient.chat.completions.create({
        model: GROQ_CONFIG.model,
        messages: [
            {
                role: 'system',
                content: `You are a Google Forms architect. Generate a high-quality form structure using the provided sections.
Return ONLY a valid JSON object: {"questions": [{"title":"...","type":"...","options":["..."]}], "themeColor": "#hex"}

RULES:
1. Questions must follow the exact chronological order of the provided sections.
2. Place basic/personal details (Name, Email, etc.) at the very top.
3. If sections < 10: Generate 2-3 questions per section.
4. If sections >= 10: Generate exactly 1-2 high-impact questions per section to ensure reliability and avoid truncation.
5. Keep question titles and options professional and concise.
6. NO markdown code blocks, NO explanation. Just raw JSON.`,
            },
            {
                role: 'user',
                content: `Topic: "${prompt}"\nSections: ${JSON.stringify(sections.map(s => ({ title: s.title, context: s.description })))}`,
            },
        ],
        temperature: GROQ_CONFIG.temperature,
        max_tokens: GROQ_CONFIG.maxTokens,
    });

    const text = completion.choices[0]?.message?.content || '';
    const data = parseJSONObject(text);

    const questions = data.questions || [];
    const themeColor = data.themeColor || '#3b82f6';
    const timeEstimate = Math.ceil(questions.length * 0.5);

    return { questions, themeColor, timeEstimate };
};

/**
 * Generates additional questions to expand an existing form.
 * @param {string} formTitle - Current form title
 * @param {string} expandPrompt - Description of what to add
 * @param {string} language - Target language
 * @returns {Array} New questions to append
 */
const generateExpandQuestions = async (formTitle, expandPrompt, language = 'English') => {
    const completion = await groqClient.chat.completions.create({
        model: GROQ_CONFIG.model,
        messages: [
            {
                role: 'system',
                content: `You are expanding an existing Google Form.
Generate 2-4 new high-quality questions based on the user's request.
Return ONLY a strictly valid JSON array of objects.
Each object must have this exact structure:
{"title":"Question text","type":"short_answer"|"paragraph"|"multiple_choice"|"checkbox"|"dropdown"|"scale","options":["opt1","opt2"]}

RULES:
1. Use "options" ONLY for multiple_choice, checkbox, and dropdown types.
2. Write ALL text in ${language}.
3. NO markdown code blocks, NO explanation, NO leading/trailing text. Just the raw JSON array.`,
            },
            {
                role: 'user',
                content: `Form title: "${formTitle}"\nExpansion request: "${expandPrompt}"`,
            },
        ],
        temperature: 0.3, // Lower temperature for more consistent JSON
        max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content || '';
    return parseJSONArray(text);
};

/**
 * Generates 4 contextual prompt suggestions for expanding an existing form.
 * @param {string} formTitle - Title of the existing form
 * @returns {Array<string>} Array of 4 suggestion strings
 */
const generateExpandSuggestions = async (formTitle) => {
    const completion = await groqClient.chat.completions.create({
        model: GROQ_CONFIG.model,
        messages: [
            {
                role: 'system',
                content: `You are a Google Forms expert. Given a form title, generate exactly 4 short, specific, and helpful suggestions for what a user could add to expand that form.
Each suggestion must be a single actionable sentence starting with a verb like "Add", "Include", or "Append".
Return ONLY a valid JSON array of 4 strings. No markdown, no explanation.`,
            },
            { role: 'user', content: `Form title: "${formTitle}"` },
        ],
        temperature: 0.6,
        max_tokens: 256,
    });

    const text = completion.choices[0]?.message?.content || '';
    return parseJSONArray(text);
};

// ── Helpers ──────────────────────────────────────────────

/**
 * Safely extracts and parses a JSON array from AI response text.
 */
function parseJSONArray(text) {
    try {
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start === -1 || end === -1) {
            throw new Error('AI response did not contain a valid JSON array.');
        }
        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr);
    } catch (err) {
        throw new Error(`Failed to parse AI response as JSON array: ${err.message}`);
    }
}

/**
 * Safely extracts and parses a JSON object from AI response text.
 */
function parseJSONObject(text) {
    try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) {
            throw new Error('AI response did not contain a valid JSON object.');
        }
        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr);
    } catch (err) {
        throw new Error(`Failed to parse AI response as JSON object: ${err.message}`);
    }
}

module.exports = {
    analyzeIntent,
    generateFormStructure,
    generateExpandQuestions,
    generateExpandSuggestions,
};
