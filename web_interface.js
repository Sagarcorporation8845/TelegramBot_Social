const express = require('express');
const SessionManager = require('./session_manager');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

let sessionManager = new SessionManager();
let activeClients = new Map(); // Store active connections

// Routes
app.get('/', async (req, res) => {
    await sessionManager.loadSessions();
    res.render('index', { sessions: sessionManager.sessions });
});

app.post('/connect/:sessionIndex', async (req, res) => {
    try {
        const sessionIndex = parseInt(req.params.sessionIndex);
        const client = await sessionManager.connectToSession(sessionIndex);
        const sessionId = `session_${Date.now()}`;
        
        activeClients.set(sessionId, {
            client,
            sessionInfo: sessionManager.sessions[sessionIndex]
        });

        const accountInfo = await sessionManager.getAccountInfo(client);
        
        res.json({
            success: true,
            sessionId,
            accountInfo
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.get('/chats/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = activeClients.get(sessionId);
        
        if (!session) {
            return res.json({ success: false, error: 'Session not found' });
        }

        const chats = await sessionManager.getRecentChats(session.client, 20);
        res.json({ success: true, chats });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.get('/messages/:sessionId/:chatId', async (req, res) => {
    try {
        const { sessionId, chatId } = req.params;
        const session = activeClients.get(sessionId);
        
        if (!session) {
            return res.json({ success: false, error: 'Session not found' });
        }

        const messages = await sessionManager.getMessages(session.client, chatId, 50);
        res.json({ success: true, messages });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/send/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { chatId, message } = req.body;
        const session = activeClients.get(sessionId);
        
        if (!session) {
            return res.json({ success: false, error: 'Session not found' });
        }

        const success = await sessionManager.sendMessage(session.client, chatId, message);
        res.json({ success });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Download and serve media
app.get('/media/:sessionId/:chatId/:messageId', async (req, res) => {
    try {
        const { sessionId, chatId, messageId } = req.params;
        const session = activeClients.get(sessionId);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Create media directory if it doesn't exist
        const mediaDir = path.join(__dirname, 'media');
        try {
            await fs.access(mediaDir);
        } catch {
            await fs.mkdir(mediaDir, { recursive: true });
        }

        // Check if file already exists
        const fileName = `${chatId}_${messageId}`;
        const filePath = path.join(mediaDir, fileName);
        
        let buffer;
        try {
            // Try to read from cache first
            buffer = await fs.readFile(filePath);
        } catch {
            // Download if not cached
            buffer = await sessionManager.downloadMedia(session.client, parseInt(messageId), chatId);
            // Cache the file
            await fs.writeFile(filePath, buffer);
        }

        // Determine content type based on file signature
        let contentType = 'application/octet-stream';
        if (buffer.length > 0) {
            const signature = buffer.toString('hex', 0, 4).toUpperCase();
            if (signature.startsWith('FFD8')) contentType = 'image/jpeg';
            else if (signature.startsWith('8950')) contentType = 'image/png';
            else if (signature.startsWith('4749')) contentType = 'image/gif';
            else if (signature.startsWith('0000')) contentType = 'video/mp4';
            else if (signature.startsWith('1A45')) contentType = 'video/webm';
        }

        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        res.send(buffer);

    } catch (error) {
        console.error('Media download error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/disconnect/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = activeClients.get(sessionId);
        
        if (session) {
            await session.client.disconnect();
            activeClients.delete(sessionId);
        }
        
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🌐 Web interface running at http://localhost:${port}`);
});

module.exports = app;