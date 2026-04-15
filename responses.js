/**
 * responses.js
 * Predefined replies with MULTIPLE VARIATIONS so the bot never sounds repetitive.
 * Each function randomly picks one reply from an array.
 */

// Helper to pick a random item from an array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const responses = {

    // Menu System — 5 variations
    menuPrompt: (userName) => pick([
        `Hello ${userName}! 👋 Kaafi accha laga aapko dekhke! Aaj main kya kar sakta hoon aapke liye?\n\n1️⃣ Products dekhne hain\n2️⃣ Support chahiye\n3️⃣ Order status check karein\n🤖 Ya kuch aur puchna ho toh seedha likh dein!`,

        `Wapas aaye ${userName} bhai! 😊 Bata do, kya dhundh rahe ho aaj?\n\n1️⃣ Products\n2️⃣ Support\n3️⃣ Order Status\n🤖 Kuch bhi type karo, main hoon!`,

        `Hey ${userName}! 👋 Sab theek? Main yahan hoon aapki help ke liye!\n\n1️⃣ Fashion catalog dekhein\n2️⃣ Team se baat karein\n3️⃣ Order track karein\n🤖 Ya AI se seedha sawaal puchein!`,

        `${userName} ji, Namaste! 🙏 Aaj aapki kya seva karein?\n\n1️⃣ Products browse karein\n2️⃣ Customer support\n3️⃣ Order track karein\n🤖 Type anything to chat with our AI!`,

        `Hello ${userName}! ✨ Aapka swagat hai! Main aapka personal shopping assistant hoon 😄\n\n1️⃣ Products\n2️⃣ Support\n3️⃣ Order Status\n🤖 Ya seedha kuch poochho!`
    ]),

    // Ask Name — 4 variations
    askName: () => pick([
        "Namaste! 🙏 Main aapko behtar help kar sakta hoon agar aap apna naam bata dein. Aapka naam kya hai?",
        "Arey waah, naya customer! 🎉 Pehle introductions toh ho jaayein — aapka naam kya hai bhai?",
        "Welcome! 👋 Main aapka WhatsApp assistant hoon. Shuru karne se pehle, aapka naam bata dijiye?",
        "Hello! Bahut khushi hui aapko yaahan dekhke. Apna naam share karein toh main aapko personally help kar sakta hoon! 😊"
    ]),

    // Greet New User — 4 variations
    greetNewUser: (userName) => pick([
        `Perfect, ${userName} ji! Ab main aapka personal assistant hoon 😄\n\n1️⃣ Products\n2️⃣ Support\n3️⃣ Order Status\n🤖 Ya kuch bhi type karein!`,

        `Bahut khushi hui ${userName} bhai! Chalo shuru karte hain!\n\n1️⃣ Fashion catalog\n2️⃣ Help & Support\n3️⃣ Track order\n🤖 AI se bhi baat kar sakte ho!`,

        `${userName} ji, shukriya! 🙏 Aaj main aapki kya help kar sakta hoon?\n\n1️⃣ Products browse karein\n2️⃣ Support team se baat karein\n3️⃣ Order check karein`,

        `Great to meet you, ${userName}! 🎉 Hamare paas bahut kuch hai aapke liye!\n\n1️⃣ Products\n2️⃣ Support\n3️⃣ Orders\n🤖 Kuch bhi poochho!`
    ]),

    // Products menu — 4 variations
    products: () => pick([
        `👗 *Fashion Catalog Directory* 👔\n\n50+ premium items available!\nKaunsi category mein ghoomna chahogen?\n\n- *Men* — Shirts, hoodies, formals\n- *Women* — Dresses, skirts, tops\n- *Shoes* — Sneakers, heels, sandals\n- *Accessories* — Bags, belts, watches\n\nReply karein category naam se! 😊`,

        `🛍️ *Our Collections*\n\nHamare paas dhamakedar collection hai!\n\n👔 *Men* — Premium clothing\n👗 *Women* — Trendy outfits\n👟 *Shoes* — All types\n💼 *Accessories* — Style essentials\n\nKaunsa category dekhna hai? Bas naam likh do!`,

        `✨ *Explore Our Fashion Store*\n\nCategories available:\n\n• *Men* — Casual to formals\n• *Women* — Latest trends\n• *Shoes* — Top brands\n• *Accessories* — Complete the look!\n\nKaunsi category dikhaun? 🤩`,

        `🏪 *Fashion Catalog*\n\n50+ hand-picked premium items!\n\nCategories:\n➡️ *Men*\n➡️ *Women*\n➡️ *Shoes*\n➡️ *Accessories*\n\nReply with any category to see products!`
    ]),

    // Support
    support: () => pick([
        `📞 *Support Team*\n\nKisi bhi sawaal ke liye:\n📧 Email: support@fashionstore.in\n📱 Call: +91 98765 43210\n⏰ Available: 10 AM – 6 PM (Mon–Sat)\n\nYa yahan apni problem likhein, AI help karega!`,

        `💬 *Hamare Support Se Baat Karein*\n\n📧 support@fashionstore.in\n📞 +91 98765 43210\n🕐 Mon–Sat, 10am to 6pm\n\nYa directly apni problem yahan type karein, hum jaldi se reply karenge! 😊`,

        `🤝 *Customer Support*\n\nHum hamesha aapke saath hain!\n\n• Email: support@fashionstore.in\n• Phone: +91 98765 43210\n• Hours: 10 AM – 6 PM\n\nKya aap apni problem yahan bata sakte hain?`
    ]),

    // Order Status
    orderStatus: () => pick([
        `🚚 *Order Tracking*\n\nApna order ID bhejein jo 'ORD-' se shuru hota hai.\nJaise: *ORD-12345*\n\nMain turant status check karta hoon! 📦`,

        `📦 *Track Your Order*\n\nApna Order ID share karein (format: ORD-XXXXX) aur main abhi status batata hoon!`,

        `🔍 *Order Status Check*\n\nBas apna Order ID type karein:\n(Example: ORD-54321)\n\nMain check karta hoon aapka parcel kahan hai! 🚀`
    ]),

    // Agent transfer
    agent: () => pick([
        "🔄 Ek second... Main aapko hamare live support agent se connect kar raha hoon. Thoda sa patience please! 🙏",
        "👤 Understood! Main abhi ek human agent ko notify kar raha hoon. Wo jald hi aapse contact karenge!",
        "📲 Sure! Live agent ko transfer kiya ja raha hai. Please wait karain — 2-3 minutes mein koi aapke paas aayega! ⏳"
    ]),

    // Stop bot
    stopSession: () => pick([
        "🛑 Aapka subscription band kar diya gaya hai. Wapas activate karne ke liye *restart* bhejein. Dhanyawaad! 🙏",
        "✅ Bot deactivated. Jab chahein, *restart* likh kar wapas shuru karein. Take care! 👋",
        "⏸️ Bot pause kar diya gaya. Wapas aane ke liye *restart* bhejein. Milte hain! 😊"
    ]),

    // Restart bot
    restartSession: () => pick([
        "✅ Welcome back! Bot phir se active ho gaya. Aaj main kya kar sakta hoon aapke liye? 😊",
        "🎉 Arey waaah, wapas aa gaye! Bot ready hai. Bolo kya chahiye?",
        "✨ Bot restart ho gaya! Kaafi miss kiya aapko. Ab bataiye, kya help chahiye? 🙏"
    ]),

    // Payment Details
    paymentDetails: (productName, price) => pick([
        `🛒 *Checkout — Almost Done!*\n\nItem: *${productName}*\nTotal: *₹${price}*\n\n💳 *Payment Options:*\n• UPI: \`fashionstore@okaxis\`\n• Bank: HDFC / A/C: 123456789 / IFSC: HDFC000123\n\nPayment karne ke baad *Done* likh kar confirm karein! ✅`,

        `💸 *Order Summary*\n\nProduct: *${productName}*\nAmount: *₹${price}*\n\n✅ Payment via:\n→ UPI: fashionstore@okaxis\n→ HDFC Bank A/C: 123456789\n\nPayment ke baad sirf *Done* type karein! 🎉`,

        `🎁 *You're About to Own: ${productName}!*\n\nTotal Payable: *₹${price}*\n\n💳 Pay via UPI: \`fashionstore@okaxis\`\nOr Bank: HDFC / 123456789 / HDFC000123\n\nPayment hone par *Done* bhejein ✅`
    ]),

    // Payment Confirmed
    paymentConfirmed: () => {
        const orderId = 'ORD-' + Math.floor(Math.random() * 90000 + 10000);
        return pick([
            `🎉 *Payment Received! Thank You!*\n\nOrder ID: *${orderId}*\nAapka item 24 ghante mein dispatch ho jayega. 🚚\nTrack karne ke liye Order ID save kar lein!`,

            `✅ *Order Confirmed!*\n\nYour Order ID: *${orderId}*\nHum aapka parcel kal tak ship kar denge! 📦\nKoi bhi sawaal ho toh puchh lena. 😊`,

            `💚 *Payment Done — Aapka Order Placed Hai!*\n\nTracking ID: *${orderId}*\n24 hours mein shipping update milega.\nShukriya aapka hamare store mein aane ka! 🙏`
        ]);
    },

    // Fallback
    fallback: () => pick([
        "Shama chahenge! 🙏 Main thoda busy hoon — ek baar phir se type karein?",
        "Oops, samajh nahi aaya! 😅 Kya aap thoda aur clearly bata sakte hain?",
        "Sorry bhai, kuch technical issue aa gaya! Phir se try karein please 🙂",
        "Mujhe lagta hai main aapki poori baat nahi pakad paya. Dobara bhejein? 🙏"
    ])
};

module.exports = responses;
