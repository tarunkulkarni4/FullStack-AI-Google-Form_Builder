const { Groq } = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

// Initialize API Clients (with dummy keys so app doesn't crash if env missing)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'dummy' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy' });
const deepseek = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY || 'dummy', baseURL: 'https://api.deepseek.com/v1' });
const mistral = new OpenAI({ apiKey: process.env.MISTRAL_API_KEY || 'dummy', baseURL: 'https://api.mistral.ai/v1' });

/**
 * Unified Completion Engine
 * Dynamically routes to the correct SDK and handles formatting.
 * Implements an automatic fallback to 'grok' if the requested API fails (e.g., missing API key).
 */
async function getCompletion(modelId, systemPrompt, userPrompt, config = {}) {
    const temperature = config.temperature || 0.7;
    const maxTokens = config.maxTokens || 1024;

    try {
        if (modelId === 'grok') {
            const response = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                temperature,
                max_tokens: maxTokens,
            });
            return response.choices[0]?.message?.content || '';
        } 
        
        if (modelId === 'gemini') {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            // Gemini doesn't have a direct 'system' role in messages the way OpenAI does, 
            // but we can pass it as instructions or via history.
            const chat = model.startChat({
                history: [
                    { role: 'user', parts: [{ text: `System Instructions: ${systemPrompt}` }] }, 
                    { role: 'model', parts: [{ text: 'Understood. I will strictly follow these instructions and output ONLY the requested JSON.' }] }
                ],
                generationConfig: { temperature, maxOutputTokens: maxTokens }
            });
            const result = await chat.sendMessage(userPrompt);
            return result.response.text();
        }

        if (modelId === 'claude') {
            const response = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
                temperature,
                max_tokens: maxTokens,
            });
            return response.content[0].text;
        }

        if (modelId === 'gpt4o') {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                temperature,
                max_tokens: maxTokens,
            });
            return response.choices[0]?.message?.content || '';
        }

        if (modelId === 'deepseek') {
            const response = await deepseek.chat.completions.create({
                model: 'deepseek-coder',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                temperature,
                max_tokens: maxTokens,
            });
            return response.choices[0]?.message?.content || '';
        }

        if (modelId === 'mistral') {
            const response = await mistral.chat.completions.create({
                model: 'mistral-large-latest',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                temperature,
                max_tokens: maxTokens,
            });
            return response.choices[0]?.message?.content || '';
        }

        throw new Error(`Unsupported model ID: ${modelId}`);
    } catch (error) {
        console.error(`[AI Router] Error with model ${modelId}:`, error.message);
        // Automatic fallback if API keys are missing or provider is down
        if (modelId !== 'grok') {
            console.log(`[AI Router] Falling back to Grok due to ${modelId} failure.`);
            return getCompletion('grok', systemPrompt, userPrompt, config);
        }
        throw error;
    }
}

// ── Helpers ──────────────────────────────────────────────
function parseJSONArray(text) {
    try {
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start === -1 || end === -1) throw new Error('No JSON array found.');
        return JSON.parse(text.substring(start, end + 1));
    } catch (err) {
        throw new Error(`Failed to parse AI response as JSON array: ${err.message}`);
    }
}

function parseJSONObject(text) {
    try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error('No JSON object found.');
        return JSON.parse(text.substring(start, end + 1));
    } catch (err) {
        throw new Error(`Failed to parse AI response as JSON object: ${err.message}`);
    }
}

// ── Endpoints ──────────────────────────────────────────────

const analyzeIntent = async (prompt, language = 'English', modelId = 'grok') => {
    const systemPrompt = `You are an expert Google Forms designer.
Analyze the user's request and suggest 4-6 relevant sections for a form.
Each suggestion must have: id (snake_case), title, description, and suggestedFields (array of 2-3 strings).
IMPORTANT: The first section MUST ALWAYS be for basic/personal details (e.g., Name, Email, Contact), unless explicitly told otherwise. Ensure all sections follow a strict, logical chronological sequence.
IMPORTANT: Write ALL text (title, description, suggestedFields) in ${language} language.
Return ONLY a valid JSON array. No markdown, no explanation, no code blocks.`;

    const text = await getCompletion(modelId, systemPrompt, prompt, { temperature: 0.7, maxTokens: 1024 });
    return parseJSONArray(text);
};

const generateFormStructure = async (prompt, sections, language = 'English', modelId = 'grok') => {
    const systemPrompt = `You are a Google Forms architect. Generate a high-quality form structure using the provided sections.
Return ONLY a valid JSON object: {"questions": [{"title":"...","type":"...","options":["..."]}], "themeColor": "#hex"}

RULES:
1. Questions must follow the exact chronological order of the provided sections.
2. Place basic/personal details (Name, Email, etc.) at the very top.
3. If sections < 10: Generate 2-3 questions per section.
4. If sections >= 10: Generate exactly 1-2 high-impact questions per section to ensure reliability and avoid truncation.
5. Keep question titles and options professional and concise.
6. NO markdown code blocks, NO explanation. Just raw JSON.`;

    const userPrompt = `Topic: "${prompt}"\nSections: ${JSON.stringify(sections.map(s => ({ title: s.title, context: s.description })))}`;
    
    const text = await getCompletion(modelId, systemPrompt, userPrompt, { temperature: 0.7, maxTokens: 1500 });
    const data = parseJSONObject(text);

    return { 
        questions: data.questions || [], 
        themeColor: data.themeColor || '#3b82f6', 
        timeEstimate: Math.ceil((data.questions || []).length * 0.5) 
    };
};

const generateExpandQuestions = async (formTitle, expandPrompt, language = 'English', modelId = 'grok') => {
    const systemPrompt = `You are expanding an existing Google Form.
Generate 2-4 new high-quality questions based on the user's request.
Return ONLY a strictly valid JSON array of objects.
Each object must have this exact structure:
{"title":"Question text","type":"short_answer"|"paragraph"|"multiple_choice"|"checkbox"|"dropdown"|"scale","options":["opt1","opt2"]}

RULES:
1. Use "options" ONLY for multiple_choice, checkbox, and dropdown types.
2. Write ALL text in ${language}.
3. NO markdown code blocks, NO explanation, NO leading/trailing text. Just the raw JSON array.`;

    const userPrompt = `Form title: "${formTitle}"\nExpansion request: "${expandPrompt}"`;
    const text = await getCompletion(modelId, systemPrompt, userPrompt, { temperature: 0.3, maxTokens: 1024 });
    return parseJSONArray(text);
};

const generateExpandSuggestions = async (formTitle, modelId = 'grok') => {
    const systemPrompt = `You are a Google Forms expert. Given a form title, generate exactly 4 short, specific, and helpful suggestions for what a user could add to expand that form.
Each suggestion must be a single actionable sentence starting with a verb like "Add", "Include", or "Append".
Return ONLY a valid JSON array of 4 strings. No markdown, no explanation.`;

    const userPrompt = `Form title: "${formTitle}"`;
    const text = await getCompletion(modelId, systemPrompt, userPrompt, { temperature: 0.6, maxTokens: 256 });
    return parseJSONArray(text);
};

module.exports = {
    analyzeIntent,
    generateFormStructure,
    generateExpandQuestions,
    generateExpandSuggestions,
};
