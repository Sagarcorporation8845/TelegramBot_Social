const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs').promises;

// Your API credentials (same as in bot.js)
const apiId = 26262293;
const apiHash = '73c279d5639e82e8c7b76733d6ea676e';

class SessionManager {
    constructor() {
        this.sessions = [];
        this.loadSessions();
    }

    // Load sessions from subdolog.txt
    async loadSessions() {
        try {
            const data = await fs.readFile('subdolog.txt', 'utf8');
            const lines = data.trim().split('\n');

            this.sessions = lines.map(line => {
                const match = line.match(/Phone: (\+\d+) \| Chat ID: (\d+) \| Session: (.+)/);
                if (match) {
                    return {
                        phone: match[1],
                        chatId: match[2],
                        sessionString: match[3]
                    };
                }
                return null;
            }).filter(Boolean);

            console.log(`📱 Loaded ${this.sessions.length} sessions`);
            this.sessions.forEach((session, index) => {
                console.log(`${index + 1}. ${session.phone}`);
            });
        } catch (error) {
            console.error('Failed to load sessions:', error.message);
        }
    }

    // Connect to a specific session
    async connectToSession(sessionIndex) {
        if (sessionIndex < 0 || sessionIndex >= this.sessions.length) {
            throw new Error('Invalid session index');
        }

        const session = this.sessions[sessionIndex];
        console.log(`🔗 Connecting to ${session.phone}...`);

        const stringSession = new StringSession(session.sessionString);
        const client = new TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: 5
        });

        await client.connect();

        if (await client.checkAuthorization()) {
            console.log(`✅ Successfully connected to ${session.phone}`);
            return client;
        } else {
            throw new Error('Session is invalid or expired');
        }
    }

    // Get account info
    async getAccountInfo(client) {
        try {
            const me = await client.getMe();
            return {
                id: me.id,
                firstName: me.firstName,
                lastName: me.lastName,
                username: me.username,
                phone: me.phone
            };
        } catch (error) {
            console.error('Failed to get account info:', error.message);
            return null;
        }
    }

    // Get recent chats
    async getRecentChats(client, limit = 10) {
        try {
            const dialogs = await client.getDialogs({ limit });
            return dialogs.map(dialog => ({
                id: dialog.id,
                title: dialog.title || dialog.name,
                isUser: dialog.isUser,
                isGroup: dialog.isGroup,
                isChannel: dialog.isChannel
            }));
        } catch (error) {
            console.error('Failed to get chats:', error.message);
            return [];
        }
    }

    // Send a message
    async sendMessage(client, chatId, message) {
        try {
            await client.sendMessage(chatId, { message });
            console.log(`📤 Message sent to ${chatId}`);
            return true;
        } catch (error) {
            console.error('Failed to send message:', error.message);
            return false;
        }
    }

    // Get messages from a chat with media support
    async getMessages(client, chatId, limit = 10) {
        try {
            const messages = await client.getMessages(chatId, { limit });
            return messages.map(msg => {
                const messageData = {
                    id: msg.id,
                    text: msg.text,
                    date: msg.date,
                    fromId: msg.fromId?.userId,
                    media: null,
                    mediaType: null
                };

                // Check for media
                if (msg.media) {
                    if (msg.media.className === 'MessageMediaPhoto') {
                        messageData.mediaType = 'photo';
                        messageData.media = {
                            id: msg.media.photo.id,
                            sizes: msg.media.photo.sizes
                        };
                    } else if (msg.media.className === 'MessageMediaDocument') {
                        const doc = msg.media.document;
                        messageData.mediaType = 'document';
                        messageData.media = {
                            id: doc.id,
                            fileName: doc.attributes?.find(attr => attr.className === 'DocumentAttributeFilename')?.fileName || 'file',
                            mimeType: doc.mimeType,
                            size: doc.size
                        };

                        // Check if it's a video, audio, or other specific type
                        if (doc.mimeType?.startsWith('video/')) {
                            messageData.mediaType = 'video';
                        } else if (doc.mimeType?.startsWith('audio/')) {
                            messageData.mediaType = 'audio';
                        } else if (doc.mimeType?.startsWith('image/')) {
                            messageData.mediaType = 'image';
                        }
                    } else if (msg.media.className === 'MessageMediaWebPage') {
                        messageData.mediaType = 'webpage';
                        messageData.media = {
                            url: msg.media.webpage.url,
                            title: msg.media.webpage.title,
                            description: msg.media.webpage.description
                        };
                    }
                }

                return messageData;
            });
        } catch (error) {
            console.error('Failed to get messages:', error.message);
            return [];
        }
    }

    // Download media file
    async downloadMedia(client, messageId, chatId) {
        try {
            const messages = await client.getMessages(chatId, { ids: [messageId] });
            if (messages.length === 0) {
                throw new Error('Message not found');
            }

            const message = messages[0];
            if (!message.media) {
                throw new Error('No media in message');
            }

            // Download the media as buffer
            const buffer = await client.downloadMedia(message, {});
            return buffer;
        } catch (error) {
            console.error('Failed to download media:', error.message);
            throw error;
        }
    }
}

// Example usage
async function main() {
    const manager = new SessionManager();
    await manager.loadSessions();

    if (manager.sessions.length === 0) {
        console.log('❌ No sessions found');
        return;
    }

    try {
        // Connect to the first session
        const client = await manager.connectToSession(0);

        // Get account info
        const accountInfo = await manager.getAccountInfo(client);
        console.log('👤 Account Info:', accountInfo);

        // Get recent chats
        const chats = await manager.getRecentChats(client, 5);
        console.log('💬 Recent Chats:', chats);

        // Disconnect when done
        await client.disconnect();
        console.log('🔌 Disconnected');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Export for use in other files
module.exports = SessionManager;

// Run if called directly
if (require.main === module) {
    main();
}