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
const express = require('express');

// Set up Express for Cloud Deployment (HuggingFace)
const app = express();
const PORT = process.env.PORT || 7860;

app.get('/', (req, res) => {
    const qrPath = path.join(__dirname, 'qr.html');
    if (fs.existsSync(qrPath)) {
        res.sendFile(qrPath);
    } else {
        res.send('<h2>WhatsApp Bot is running! Waiting for QR Code or already logged in.</h2>');
    }
});

app.listen(PORT, () => console.log(`🌍 Cloud Web Server running on port ${PORT}`));

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
    
    await msg.reply(text);
}

// Event: Show QR code
client.on('qr', (qr) => {
    console.log('--- QR CODE RECEIVED ---');
    qrcode.generate(qr, { small: true });

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>WhatsApp QR Code</title></head>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; background-color:#f0f0f0; font-family:sans-serif;">
            <div style="background:white; padding:40px; border-radius:10px; box-shadow:0 4px 8px rgba(0,0,0,0.1); text-align:center;">
                <h2>Scan with WhatsApp</h2>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}" alt="QR Code" style="margin-top:20px;"/>
                <p style="margin-top:20px; color:#555;">Open WhatsApp > Settings > Linked Devices</p>
            </div>
        </body>
        </html>
    `;
    fs.writeFileSync('qr.html', htmlContent);
    console.log('✅ QR Code also saved to "qr.html" in your folder.');
});

// Event: Bot is ready
client.on('ready', () => {
    console.log('✅ Bot is ready! Logged in as:', client.info.pushname);
});

// Event: Handling incoming messages
client.on('message', async (msg) => {
    if (!msg.body) return;

    const messageBody = msg.body.trim();
    const messageLower = messageBody.toLowerCase();
    const sender = msg.from;
    const chat = await msg.getChat();

    console.log(`[Message] From: ${sender} | Content: ${messageBody}`);

    try {
        const user = await db.getUserSession(sender);

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
        console.log('Generating AI reply with memory context...');
        await db.saveMessage(sender, "user", messageBody);
        const updatedUser = await db.getUserSession(sender);
        chat.sendStateTyping(); 
        
        const aiReply = await generateAIResponse(updatedUser.history);
        
        if (aiReply) {
            await db.saveMessage(sender, "assistant", aiReply);
            await replyWithTypingDelay(msg, chat, aiReply, 500); 
        } else {
            await replyWithTypingDelay(msg, chat, responses.fallback());
        }

    } catch (error) {
        console.error('Error handling message:', error);
        msg.reply(responses.fallback());
    }
});

client.on('auth_failure', (msg) => console.error('❌ Auth failure:', msg));
client.on('disconnected', (reason) => {
    console.log('❌ Disconnected:', reason);
    client.initialize();
});

console.log('Initializing WhatsApp Client...');
client.initialize();
