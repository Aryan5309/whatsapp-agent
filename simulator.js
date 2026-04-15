/**
 * simulator.js  —  DYNAMIC MULTI-BOT AI SIMULATOR
 * (Supports up to 20 Customer Bots dynamically)
 */

require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const axios = require('axios');
const express = require('express');

// ============================================================
// Config
// ============================================================
const BUSINESS_NUMBER = '919709034096';
const businessJid    = BUSINESS_NUMBER + '@c.us';
const MAX_BIZ_MSGS   = 25;

const delay = ms => new Promise(r => setTimeout(r, ms));

// ============================================================
// AI Config
// ============================================================
const CUSTOMER_PERSONA = `
You are Rahul, a 24-year-old guy from Delhi chatting on WhatsApp with a fashion store.
You want to browse clothes, check prices, maybe buy something.

RULES:
- Write ONLY in casual Hinglish (Hindi+English mix) like a real WhatsApp text
- Max 1-2 SHORT lines per message — no essays
- React naturally: "oh nice!", "thoda costly hai yaar", "aur kuch dikhao", "okay bhai"
- Follow this rough flow: greet → ask products → browse men's → ask about one item →
  try to buy → ask delivery → ask return policy → general question → say bye → send: stop
- After 22-24 total messages, wrap up and send EXACTLY the word: stop
- Output ONLY your next message. Nothing else.
- NEVER break character. You are the CUSTOMER buying from the store. You do not sell anything.
`;

const ASSISTANT_PERSONA = `
You are Arya, a friendly helpful AI assistant chatting on WhatsApp.
You can help with anything: questions, advice, facts, jokes, coding, general knowledge.

RULES:
- Reply in the same language the user uses
- Keep replies SHORT and conversational
- Be warm, friendly, slightly witty
- If asked who you are: say you're Arya, an AI assistant
- Output ONLY the reply message. Nothing else.
`;

async function callWithKey(apiKey, systemPrompt, history, maxTokens, temperature) {
    const isOR = apiKey.startsWith('sk-or-v1-');
    const endpoint = isOR ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.deepseek.com/chat/completions';
    const model    = isOR ? 'deepseek/deepseek-chat' : 'deepseek-chat';

    const res = await axios.post(endpoint, {
        model, max_tokens: maxTokens, temperature,
        messages: [{ role: 'system', content: systemPrompt }, ...history]
    }, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...(isOR && { 'HTTP-Referer': 'https://github.com/whatsapp-web-js', 'X-Title': 'WhatsApp Simulator' })
        },
        timeout: 20000
    });
    return res.data.choices[0].message.content.trim();
}

async function callAI(systemPrompt, history, maxTokens = 150, temperature = 0.88) {
    const keys = [
        process.env.DEEPSEEK_API_KEY,
        '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',
        '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',
        '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',
        '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'
    ].filter(k => k && k !== 'your_api_key_here');

    let lastError = '';
    for (const key of keys) {
        try {
            return await callWithKey(key, systemPrompt, history, maxTokens, temperature);
        } catch (e) {
            lastError = e.response?.data?.error?.message || e.message || '';
        }
    }
    console.error(`❌ ALL API KEYS FAILED in simulator. Last Error: ${lastError}`);
    return null;
}

// ============================================================
// Multi-bot Class
// ============================================================
class SimulatorBot {
    constructor(id) {
        this.id = id;
        this.status = 'booting';
        this.qr = null;
        this.qrAge = 0;
        this.readyAt = 0;
        
        // Session state
        this.bizActive = false;
        this.bizLocked = false;
        this.bizHistory = [];
        this.bizMsgCount = 0;
        this.users = {};

        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: `simulatorbot-${this.id}` }),
            puppeteer: {
                args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage',
                       '--disable-accelerated-2d-canvas','--no-first-run','--no-zygote','--disable-gpu']
            }
        });

        this.setupEvents();
    }

    setupEvents() {
        this.client.on('qr', (qr) => {
            console.log(`--- SIMULATOR ${this.id} QR ---`);
            this.qr = qr;
            this.qrAge = Date.now();
            this.status = 'qr';
        });

        this.client.on('ready', () => {
            console.log(`✅ Simulator ${this.id} ready!`);
            this.status = 'online';
            this.qr = null;
            this.readyAt = Date.now();
        });

        this.client.on('disconnected', (reason) => {
            console.log(`❌ [🤖 SIMULATOR ${this.id}] Disconnected:`, reason);
            this.status = 'booting';
            this.client.initialize();
        });

        this.client.on('message_create', async (msg) => {
            if (msg.isStatus) return;
            if (!msg.fromMe) return;
            if (msg.body.trim().toLowerCase() !== 'restart') return;

            console.log(`\n🔄 [🤖 SIMULATOR ${this.id}] RESTART triggered.`);
            this.bizActive = true;
            this.bizLocked = false;
            this.bizHistory = [];
            this.bizMsgCount = 0;

            await delay(3000);
            this.bizLocked = true;
            try { await this.sendToBusiness(null); } 
            catch (e) { console.error('Error on start:', e.message); } 
            finally { this.bizLocked = false; }
        });

        this.client.on('message', async (msg) => {
            if (msg.isStatus) return;
            if (msg.fromMe) return;
            if (msg.from.includes('@g.us') || msg.from === 'status@broadcast') return;

            if (msg.from === businessJid) {
                if (!this.bizActive || this.bizLocked) return;
                this.bizLocked = true;
                try { await this.sendToBusiness(msg.body); } 
                catch (e) {} 
                finally { this.bizLocked = false; }
                return;
            }

            await this.replyAsAssistant(msg);
        });
    }

    async sendToBusiness(lastBizReply) {
        if (!this.bizActive) return;
        if (this.bizMsgCount >= MAX_BIZ_MSGS) {
            try { await this.client.sendMessage(businessJid, 'stop'); } catch (e) {}
            this.bizActive = false; this.bizHistory = []; this.bizMsgCount = 0;
            return;
        }

        if (lastBizReply) this.bizHistory.push({ role: 'assistant', content: lastBizReply });

        // Force reminder at end so AI doesn't hallucinate context
        const context = [...this.bizHistory, { role: 'system', content: 'REMINDER: You are the CUSTOMER. STRICTLY NO ESSAYS. MAX 5-8 WORDS. NEVER SEND 2 MESSAGES.' }];
        const reply = await callAI(CUSTOMER_PERSONA, context, 50, 0.9);
        let msgOut = reply || 'Sir mera ek order tha';
        // Enforce short string
        msgOut = msgOut.replace(/\n+/g, ' ').substring(0, 100);

        this.bizHistory.push({ role: 'user', content: msgOut });

        const wait = 3000 + Math.floor(Math.random() * 2000);
        await delay(wait);

        console.log(`📤 [🤖 SIMULATOR ${this.id} → BIZ]: "${msgOut}"`);
        await this.client.sendMessage(businessJid, msgOut);
        this.bizMsgCount++;
    }

    async replyAsAssistant(msg) {
        const jid = msg.from;
        const body = msg.body.trim();

        if (!this.users[jid]) this.users[jid] = { history: [], paused: false };
        const u = this.users[jid];

        if (body.toLowerCase() === 'stop') { u.paused = true; return; }
        if (u.paused) u.paused = false;

        u.history.push({ role: 'user', content: body });
        if (u.history.length > 12) u.history = u.history.slice(-12);

        const aiReply = await callAI(ASSISTANT_PERSONA, u.history, 200, 0.85);

        if (!aiReply) {
            try { await msg.reply('⚠️ Bhai, mere AI server ke credits khatam ho gaye hain! (API Error)'); } catch(e) {}
            return;
        }

        u.history.push({ role: 'assistant', content: aiReply });
        await delay(1500 + Math.floor(Math.random() * 1000));

        try {
            const chat = await msg.getChat();
            await chat.sendStateTyping();
            await delay(1000);
            await chat.sendMessage(aiReply);
            console.log(`✅ [🤖 SIMULATOR ${this.id} → ASSISTANT REPLY to ${jid}]: "${aiReply.slice(0, 60)}"`);
        } catch (e) {}
    }

    async start() {
        this.client.initialize();
    }
}

// ============================================================
// Multi-Bot Manager & Internal API
// ============================================================
const simulators = [];

function getBotCount() {
    try {
        if (!fs.existsSync('bots_config.json')) return 1; // Default 1 bot
        return JSON.parse(fs.readFileSync('bots_config.json')).count || 1;
    } catch(e) { return 1; }
}

function setBotCount(count) {
    fs.writeFileSync('bots_config.json', JSON.stringify({ count }));
}

async function bootAllBots() {
    const count = getBotCount();
    console.log(`🚀 Starting ${count} Dynamic Customer Bots...`);
    for (let i = 1; i <= count; i++) {
        const bot = new SimulatorBot(i);
        simulators.push(bot);
        bot.start();
        await delay(4000); // 4s stagger to avoid CPU spike
    }
}

// Inter-process API for dashboard (server.js) to poll
const app = express();
app.use(express.json());

app.get('/api/internal/bots', (req, res) => {
    const data = simulators.map(s => ({
        id: s.id,
        status: s.status,
        qr: s.qr,
        qrAge: s.qrAge ? Math.floor((Date.now() - s.qrAge)/1000) : 0
    }));
    res.json(data);
});

app.post('/api/internal/add', async (req, res) => {
    let count = getBotCount();
    if (count >= 20) return res.status(400).json({ error: 'Max 20 bots allowed' });
    
    count++;
    setBotCount(count);
    
    const newBot = new SimulatorBot(count);
    simulators.push(newBot);
    newBot.start();
    
    res.json({ success: true, count });
});

app.listen(3001, () => {
    console.log('🔌 Simulator Manager API listening on internal port 3001');
    bootAllBots();
});
