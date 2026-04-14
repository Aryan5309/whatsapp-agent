/**
 * ai.js
 * DeepSeek AI Integration using Axios.
 */
require('dotenv').config();
const axios = require('axios');

// System prompt to set the bot's personality
const SYSTEM_PROMPT = `
You are a smart, polite, and friendly business assistant for a company.
Your tone should be professional yet welcoming.
You must reply in Hinglish (a natural mix of Hindi and English) as commonly spoken in India.
Your goal is to help customers with:
- Product information
- Pricing details
- Order queries
- General FAQs
Keep your responses concise and helpful. Be sales-oriented but don't be pushy.
`;

async function generateAIResponse(messageHistory) {
    try {
        const apiKey = process.env.DEEPSEEK_API_KEY;
        
        if (!apiKey || apiKey === 'your_api_key_here') {
            throw new Error('API Key is missing or invalid in .env');
        }

        // Detect if it's an OpenRouter key or Direct DeepSeek key
        const isOpenRouter = apiKey.startsWith('sk-or-v1-');
        const endpoint = isOpenRouter 
            ? 'https://openrouter.ai/api/v1/chat/completions' 
            : 'https://api.deepseek.com/chat/completions';
        
        const modelName = isOpenRouter 
            ? 'deepseek/deepseek-chat' 
            : 'deepseek-chat';

        // Insert the system prompt at the beginning of the history
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...messageHistory
        ];

        const response = await axios.post(endpoint, {
            model: modelName,
            max_tokens: 800,
            messages: messages,
            stream: false
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                // Optional OpenRouter headers
                ...(isOpenRouter && {
                    'HTTP-Referer': 'https://github.com/whatsapp-web-js/whatsapp-web.js',
                    'X-Title': 'WhatsApp AI Bot'
                })
            }
        });

        // Extracting the text response from DeepSeek's OpenAI-compatible format
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('DeepSeek API Error:', error.response ? error.response.data : error.message);
        return null; // Return null so the main bot can use the fallback message
    }
}

module.exports = { generateAIResponse };
