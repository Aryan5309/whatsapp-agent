/**
 * simulator.js
 * Automated "Customer" Bot to test the Business Agent.
 * Listens for "restart" from your own phone to trigger the 25-step loop!
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const TARGET_NUMBER = '919709034096'; 
const targetJid = TARGET_NUMBER + '@c.us';

const simulator = new Client({
    authStrategy: new LocalAuth({ clientId: 'simulator-bot' }),
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

const steps = [
    "Hi",
    "AutomatedTester",    
    "1",                  
    "Men",                
    "P04",                
    "Buy P04",            
    "Done",               
    "What other product categories do you have?", 
    "Do you have any formal suits?",             
    "What is the average price for shoes?",      
    "2",                  
    "I want to exchange an item I bought yesterday.", 
    "What is the return policy?",
    "3",                  
    "ORD-98765",          
    "Do you offer free shipping?", 
    "How long does delivery take?",
    "Agent",              
    "Is anyone there from the live team?",
    "Menu",               
    "Women",              
    "Does the first dress come in black?",
    "Okay, I will think about it.",
    "Thank you for your help!",
    "stop"                
];

let currentStep = 0;
let isStarted = false; // Controls if we are actively looping
let isProcessingReply = false; // Prevents double queuing if business bot sends multiple messages

const delay = (ms) => new Promise(res => setTimeout(res, ms));

simulator.on('qr', (qr) => {
    console.log('--- SIMULATOR QR CODE RECEIVED ---');
    qrcode.generate(qr, { small: true });
    
    // HTML wrapper
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>WhatsApp QR Code (Simulator)</title></head>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; background-color:#202020; font-family:sans-serif; color:white;">
            <div style="background:#303030; padding:40px; border-radius:10px; text-align:center;">
                <h2>Scan with CUSTOMER WhatsApp</h2>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}" alt="QR Code" style="margin-top:20px;"/>
            </div>
        </body>
        </html>
    `;
    fs.writeFileSync('qr_simulator.html', htmlContent);
});

simulator.on('ready', async () => {
    console.log('✅ Simulator Bot is ready! Logged in as:', simulator.info.pushname);
    console.log(`Ready to trigger. Open your customer WhatsApp and manually send "restart" to ${TARGET_NUMBER} to begin the 25 questions.`);
});

async function sendNextMessage() {
    if (currentStep >= steps.length) {
        console.log("🎉 All automated steps completed safely!");
        console.log("Simulator paused. Type 'restart' on your phone to run again!");
        isStarted = false;
        return;
    }

    const messageToSend = steps[currentStep];
    console.log(`\n[Simulator Sending] -> Step ${currentStep + 1}/${steps.length}: "${messageToSend}"`);
    
    try {
        await simulator.sendMessage(targetJid, messageToSend);
        currentStep++;
    } catch (e) {
        console.error("Failed to send message", e);
    }
}

// 1. Listen for OUTGOING messages (manually sent from your customer phone)
simulator.on('message_create', async (msg) => {
    // If you type "restart", we reset and start shooting
    if (msg.body.trim().toLowerCase() === 'restart') {
        console.log("\n🔄 RESTART TRIGGERED! Starting 25 steps again...");
        currentStep = 0; // Reset
        isStarted = true;
        isProcessingReply = true;
        
        // Wait 3 seconds to let business bot finish replying to the 'restart' text, then send 'Hi'
        await delay(3000);
        await sendNextMessage();
        isProcessingReply = false;
    }
});

// 2. Listen for INCOMING messages (replies from the business bot)
simulator.on('message', async (msg) => {
    // Rely solely on isStarted and ignoring group messages to bypass @lid number obfuscation
    if (isStarted && !msg.from.includes('@g.us') && !isProcessingReply) {
        isProcessingReply = true;
        console.log(`[Business Bot Replied]: ${msg.body.substring(0, 50)}...`);
        
        // Anti-ban randomness: 4 to 8 seconds delay
        const randomWaitTime = Math.floor(Math.random() * 4000) + 4000;
        console.log(`Waiting ${Math.floor(randomWaitTime/1000)} seconds before next reply to avoid ban...`);
        
        await delay(randomWaitTime);

        await sendNextMessage();
        isProcessingReply = false;
    }
});

console.log('Initializing Simulator Client...');
simulator.initialize();
