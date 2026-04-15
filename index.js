/**
 * index.js
 * Main entry point for the WhatsApp AI Chatbot.
 */

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const responses = require('./responses');
const { generateAIResponse } = require('./ai');
const db = require('./database');
require('dotenv').config();
const path = require('path');

// Load the catalog
let productsCatalog = [];
try {
    const data = fs.readFileSync('./products.json', 'utf8');
    productsCatalog = JSON.parse(data);
} catch(e) {
    console.error("Failed to load products.json. Make sure to run seed_products.js first!");
}

// Create a new WhatsApp client instance
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    }
});

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function replyWithTypingDelay(msg, chat, text, baseDelayMs = 1500) {
    try { await chat.sendStateTyping(); } catch(e) {}
    
    // Anti-ban randomness: Adds roughly 2 to 4 extra seconds randomly
    const randomDelay = Math.floor(Math.random() * 2000) + 2000;
    await delay(baseDelayMs + randomDelay);
    
    await chat.sendMessage(text);
}

// QR Code event
client.on('qr', (qr) => {
    console.log('--- [💼 BUSINESS BOT] QR ---');
    qrcode.generate(qr, { small: true });
    fs.writeFileSync('business_qr.txt', qr);
    console.log('✅ [💼 BUSINESS BOT] QR saved. Open dashboard to scan.');
});

// Ready event
client.on('ready', () => {
    console.log('✅ [💼 BUSINESS BOT] ready! Logged in as:', client.info.pushname);
    // Clear QR file since we're logged in
    if (fs.existsSync('business_qr.txt')) fs.unlinkSync('business_qr.txt');

    // Upload WhatsApp Status exactly every 30 minutes (48 per day)
    setInterval(async () => {
        try {
            const statusTexts = [
                "👗 Check out our latest Fashion Collection!",
                "🔥 Huge discounts available on Men's wear today.",
                "👟 Top branded Shoes in stock! Message 'Hi' to order.",
                "⌚ Premium quality accessories available now.",
                "🚚 Fast & safe delivery on all prepaid orders!",
                "🛒 Reply 'Hi' to chat with our assistant and browse."
            ];
            const t = statusTexts[Math.floor(Math.random() * statusTexts.length)];
            await client.sendMessage('status@broadcast', t);
            console.log('🌟 [💼 BUSINESS BOT] Uploaded WhatsApp Status:', t);
        } catch (e) {
            console.error('Error uploading status:', e.message);
        }
    }, 30 * 60 * 1000);
});


// Event: Handling incoming messages
client.on('message', async (msg) => {
    if (msg.isStatus || msg.from === 'status@broadcast') return;
    if (!msg.body) return;

    const messageBody = msg.body.trim();
    const messageLower = messageBody.toLowerCase();
    const sender = msg.from;
    const chat = await msg.getChat();

    console.log(`\n--- 📥 NEW MESSAGE [💼 BUSINESS BOT] ---`);
    console.log(`From: ${sender}`);
    console.log(`Body: ${messageBody}`);
    console.log(`------------------------------------`);

    try {
        const user = await db.getUserSession(sender);
        console.log(`[State]: ${user.state} | [History]: ${user.history ? user.history.length : 0} msgs`);

        // --- Opt-Out Logic ---
        if (messageLower === 'stop') {
            await db.updateUser(sender, { isOptedOut: true });
            await replyWithTypingDelay(msg, chat, responses.stopSession(), 500);
            return;
        }
        if (messageLower === 'restart') {
            await db.updateUser(sender, { isOptedOut: false });
            await replyWithTypingDelay(msg, chat, responses.restartSession(), 500);
            return;
        }
        if (user.isOptedOut) return;

        // --- Lead Capture ---
        if (user.state === 'NEW') {
            await replyWithTypingDelay(msg, chat, responses.askName(), 1000);
            await db.updateUser(sender, { state: 'ASKING_NAME' });
            return;
        }

        if (user.state === 'ASKING_NAME') {
            const extractedName = messageBody.split(" ")[0];
            await db.updateUser(sender, { name: extractedName, state: 'ACTIVE' });
            await replyWithTypingDelay(msg, chat, responses.greetNewUser(extractedName), 1500);
            return;
        }

        // --- Fake Checkout Logic ---
        if (user.pendingPayment && messageLower === 'done') {
            await replyWithTypingDelay(msg, chat, responses.paymentConfirmed(), 1000);
            await db.updateUser(sender, { pendingPayment: false });
            return;
        }

        let isDirectCommand = true;

        // --- E-Commerce Catalog Logic ---
        const categories = ['men', 'women', 'shoes', 'accessories'];
        
        // 1. Browsing a Category
        if (categories.includes(messageLower)) {
            const filtered = productsCatalog.filter(p => p.category.toLowerCase() === messageLower).slice(0, 5); // Show first 5
            let text = `👕 *${messageLower.toUpperCase()} Catalog*\n\n`;
            filtered.forEach(p => {
                text += `*ID: ${p.id}* - ${p.name} (₹${p.price})\n`;
            });
            text += `\n🔍 To see a photo of an item, reply with the ID (e.g. *${filtered[0].id}*).\n🛒 To buy an item, reply *Buy ${filtered[0].id}*`;
            
            await replyWithTypingDelay(msg, chat, text, 1000);
            return;
        }

        // 2. Exact Product Match (e.g. "P01") -> Send image
        const productMatch = productsCatalog.find(p => p.id.toLowerCase() === messageLower);
        if (productMatch) {
            try {
                await chat.sendStateTyping();
                const media = await MessageMedia.fromUrl(productMatch.image_url, { unsafeMime: true });
                const caption = `👗 *${productMatch.name}*\n\nPrice: *₹${productMatch.price}*\n${productMatch.description}\n\n🛒 To purchase, reply with: *Buy ${productMatch.id}*`;
                await chat.sendMessage(media, { caption: caption });
            } catch (e) {
                console.log("Failed to send image URL", e);
                await replyWithTypingDelay(msg, chat, `Error loading image for ${productMatch.name}. Price is ₹${productMatch.price}. Reply *Buy ${productMatch.id}* to buy.`, 500);
            }
            return;
        }

        // 3. Buy Intent (e.g. "Buy P01")
        if (messageLower.startsWith('buy p')) {
            const targetId = messageLower.split(' ')[1];
            const toBuy = productsCatalog.find(p => p.id.toLowerCase() === targetId);
            
            if (toBuy) {
                // Update tracker
                await db.updateUser(sender, { pendingPayment: true });
                await replyWithTypingDelay(msg, chat, responses.paymentDetails(toBuy.name, toBuy.price), 1000);
            } else {
                await replyWithTypingDelay(msg, chat, "Sorry, I couldn't find that product ID. Please check the catalog.", 1000);
            }
            return;
        }

        // --- Standard Menus ---
        if (messageLower === '1') {
            await replyWithTypingDelay(msg, chat, responses.products(), 1000);
            return;
        } else if (messageLower === '2') {
            await replyWithTypingDelay(msg, chat, responses.support(), 1000);
            return;
        } else if (messageLower === '3') {
            await replyWithTypingDelay(msg, chat, responses.orderStatus(), 1000);
            return;
        } else if (messageLower === 'agent') {
            await replyWithTypingDelay(msg, chat, responses.agent(), 1000);
            return;
        } else if (messageLower === 'hi' || messageLower === 'hello' || messageLower === 'menu') {
            await replyWithTypingDelay(msg, chat, responses.menuPrompt(user.name), 1000);
            return;
        }

        // --- Send to DeepSeek AI ---
        console.log('🤖 [💼 BUSINESS BOT] Sending to DeepSeek AI for response...');
        await db.saveMessage(sender, "user", messageBody);
        const updatedUser = await db.getUserSession(sender);
        chat.sendStateTyping(); 
        
        let aiReply = await generateAIResponse(updatedUser.history);
        
        if (aiReply) {
            console.log('✅ [💼 BUSINESS BOT] AI Responded Successfully');
            // Enforce response length to prevent "bahut lamba lamba"
            aiReply = aiReply.length > 200 ? aiReply.substring(0, 200) + '...' : aiReply;
            await db.saveMessage(sender, "assistant", aiReply);
            await replyWithTypingDelay(msg, chat, aiReply, 500); 
        } else {
            console.log('⚠️ [💼 BUSINESS BOT] AI returned empty or null. Sending fallback.');
            await replyWithTypingDelay(msg, chat, responses.fallback());
        }

    } catch (error) {
        console.error('❌ [💼 BUSINESS BOT] CRITICAL ERROR:', error);
        if (msg && msg.getChat) {
             const chat = await msg.getChat().catch(()=>null);
             if (chat) chat.sendMessage(responses.fallback());
        }
    }
});

client.on('auth_failure', (msg) => console.error('❌ Auth failure:', msg));
client.on('disconnected', (reason) => {
    console.log('❌ Disconnected:', reason);
    client.initialize();
});

console.log('Initializing WhatsApp Client...');
client.initialize();
