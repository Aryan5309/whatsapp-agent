/**
 * ai.js
 * DeepSeek AI Integration with automatic failover to backup API key.
 * Primary key: from DEEPSEEK_API_KEY env variable
 * Backup key: hardcoded fallback (OpenRouter)
 */
require('dotenv').config();
const axios = require('axios');

// System prompt for the Business Bot
const SYSTEM_PROMPT = `
You are a smart, polite, and friendly business assistant for a fashion store.
Your tone should be professional yet welcoming.
You must reply in Hinglish (a natural mix of Hindi and English) as commonly spoken in India.
Your goal is to help customers with:
- Product info & Pricing
- Orders & FAQs

STRICT RULES:
- BE EXTREMELY BRIEF AND SHORT.
- Max 5-15 words per message.
- Output EXACTLY ONE short sentence. NO long paragraphs.
- Be very conversational and act like texting on WhatsApp.
- Never act like a robot, keep it natural and Hinglish.
- If asked a question, reply directly and shortly.
`;

// ── Call AI with a specific key ───────────────────────────
async function callWithKey(apiKey, messageHistory) {
    const isOpenRouter = apiKey.startsWith('sk-or-v1-');
    const endpoint = isOpenRouter
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.deepseek.com/chat/completions';
    const model = isOpenRouter ? 'deepseek/deepseek-chat' : 'deepseek-chat';

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messageHistory
    ];

    const response = await axios.post(endpoint, {
        model,
        max_tokens: 400,
        messages,
        stream: false
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...(isOpenRouter && {
                'HTTP-Referer': 'https://github.com/whatsapp-web-js/whatsapp-web.js',
                'X-Title': 'WhatsApp AI Bot'
            })
        },
        timeout: 15000
    });

    return response.data.choices[0].message.content;
}

// ── Main function with automatic failover ─────────────────
async function generateAIResponse(messageHistory) {
    const keys = [
        process.env.DEEPSEEK_API_KEY,
        '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', // Newest
        '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',
        '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',
        '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' // The oldest backup
    ].filter(k => k && k !== 'your_api_key_here');

    let lastError = '';

    for (const key of keys) {
        try {
            const reply = await callWithKey(key, messageHistory);
            console.log(`✅ AI replied successfully (using key: ${key.substring(0, 15)}...)`);
            return reply;
        } catch (err) {
            lastError = err.response?.data?.error?.message || err.message || '';
            console.warn(`⚠️ Token failed (${key.substring(0, 15)}): ${lastError.substring(0, 80)}. Switching to next...`);
        }
    }

    console.error(`❌ ALL API KEYS FAILED. Last Error: ${lastError}`);
    return null; // All keys failed
}

module.exports = { generateAIResponse };
