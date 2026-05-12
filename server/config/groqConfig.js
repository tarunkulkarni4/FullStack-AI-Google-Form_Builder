const Groq = require('groq-sdk');

/**
 * Singleton Groq client for AI form generation.
 * Uses Llama 3.3 70B model via Groq's ultra-fast inference.
 */
const groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Default model configuration
const GROQ_CONFIG = {
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    maxTokens: 4096,
};

module.exports = { groqClient, GROQ_CONFIG };
