const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

// Initialize database if it doesn't exist
async function initDB() {
    try {
        await fs.access(dbPath);
    } catch (error) {
        // File doesn't exist, create an empty one
        await fs.writeFile(dbPath, JSON.stringify({ users: {} }, null, 2));
    }
}

// Read the database
async function readDB() {
    await initDB();
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
}

// Write to the database
async function writeDB(data) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// Get or create a user session
async function getUserSession(userId) {
    const db = await readDB();
    if (!db.users[userId]) {
        db.users[userId] = {
            name: null,
            state: 'NEW', // NEW -> ASKING_NAME -> ACTIVE 
            isOptedOut: false, // Flag to stop bot for this user
            pendingPayment: false, // Track if waiting for 'Done'
            history: []   // Store last 5 messages here
        };
        await writeDB(db);
    }
    // Backward compatibility for existing users without flag
    if (db.users[userId].isOptedOut === undefined) {
        db.users[userId].isOptedOut = false;
        await writeDB(db);
    }
    return db.users[userId];
}

// Update user details
async function updateUser(userId, data) {
    const db = await readDB();
    if (db.users[userId]) {
        db.users[userId] = { ...db.users[userId], ...data };
        await writeDB(db);
    }
}

// Save a conversation message to user's history
async function saveMessage(userId, role, content) {
    const user = await getUserSession(userId);
    user.history.push({ role, content });
    
    // Keep only the last 5 sets of (user + assistant) -> let's keep max 10 messages total
    if (user.history.length > 10) {
        user.history = user.history.slice(user.history.length - 10);
    }
    
    await updateUser(userId, { history: user.history });
}

module.exports = {
    getUserSession,
    updateUser,
    saveMessage
};
