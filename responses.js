/**
 * responses.js
 * Predefined replies for simple keywords, menus, and fallback.
 */

const responses = {
    // Menu System
    menuPrompt: (userName) => {
        return `Hello ${userName}! 👋 Welcome back to our business desk.
How can I help you today? Please reply with a number:

1️⃣ Show Products
2️⃣ Contact Support
3️⃣ Order Status
🤖 Or text anything else to chat with me!`;
    },

    askName: () => {
        return "Namaste! 🙏 Welcome to our business assistant. Main aapko behtar service de saku uske liye, please apna naam batayein? (Before we begin, could you please tell me your name?)";
    },

    greetNewUser: (userName) => {
        return `Thank you, ${userName}! Boliye, aaj main aapki kaise help kar sakta hoon? (How can I help you today?)
        
1️⃣ Show Products
2️⃣ Contact Support
3️⃣ Order Status
🤖 Type anything else to chat with me!`;
    },

    // 1 -> Products Catalog Instructions
    products: () => {
        return `👗 *Fashion Catalog Directory* 👔

We have 50+ premium fashion items!
Reply with any of these categories to view products:
- *Men*
- *Women*
- *Shoes*
- *Accessories*

(Example: Reply "Men" to see men's clothing)`;
    },

    // 2 -> Support
    support: () => {
        return `📞 *Support Details*

You can reach out to our team via:
- Email: support@example.com
- Call: +91 98765 43210
Timing: 10 AM to 6 PM (Mon-Sat)

Please leave your issue here, and the AI will try to help you too!`;
    },

    // 3 -> Order Status
    orderStatus: () => {
        return `🚚 *Order Status*

To check your order status, please reply with your Order ID starting with 'ORD-' (e.g., ORD-12345).`;
    },

    // "agent" -> Connect to human
    agent: () => {
        return "🔄 Please wait... Aapka chat ek live human agent ko transfer kiya ja raha hai. They will ping you shortly! (Transferring to a human agent...)";
    },

    // Stop bot
    stopSession: () => {
        return "🛑 You have successfully unsubscribed. The bot is now disabled for this chat. Send *restart* to activate it again.";
    },

    // Restart bot
    restartSession: () => {
        return "✅ Welcome back! The bot is active again. Boliye, aaj main aapki kaise help kar sakta hoon?";
    },

    // Start Fake Payment
    paymentDetails: (productName, price) => {
        return `🛒 *Checkout*
        
You have selected: *${productName}*
Total Amount: *₹${price}*

💳 *Payment Methods:*
- UPI: \`fashionstore@okaxis\`
- Bank Transfer: HDFC Bank / A/C: 123456789 / IFSC: HDFC000123

✅ **IMPORTANT:** Once you complete the payment, reply with exactly the word *Done* to confirm your order.`;
    },

    // Payment Confirmed
    paymentConfirmed: () => {
        const orderId = 'ORD-' + Math.floor(Math.random() * 90000 + 10000);
        return `🎉 *Payment Confirmed!* 

Thank you for your purchase! 
Your processing ID is: ${orderId} 
We will ship your item within 24 hours.`;
    },

    // Fallback response (if AI fails)
    fallback: () => {
        return "Shama chahenge, main abhi thoda busy hoon. Kya aap apna message repeat kar sakte hain? (Sorry, I'm a bit busy. Can you repeat your message?)";
    }
};

module.exports = responses;
