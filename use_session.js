const SessionManager = require('./session_manager');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise(resolve => rl.question(prompt, resolve));
}

async function main() {
    console.log('🔐 Telegram Session Manager\n');
    
    const manager = new SessionManager();
    await manager.loadSessions();

    if (manager.sessions.length === 0) {
        console.log('❌ No sessions found in subdolog.txt');
        rl.close();
        return;
    }

    // Select session
    const sessionIndex = parseInt(await question('\nSelect session number: ')) - 1;
    
    try {
        const client = await manager.connectToSession(sessionIndex);
        
        while (true) {
            console.log('\n📋 Available actions:');
            console.log('1. Get account info');
            console.log('2. List recent chats');
            console.log('3. Send message');
            console.log('4. Read messages');
            console.log('5. Exit');
            
            const choice = await question('\nChoose action: ');
            
            switch (choice) {
                case '1':
                    const info = await manager.getAccountInfo(client);
                    console.log('\n👤 Account Info:');
                    console.log(JSON.stringify(info, null, 2));
                    break;
                    
                case '2':
                    const chats = await manager.getRecentChats(client);
                    console.log('\n💬 Recent Chats:');
                    chats.forEach((chat, i) => {
                        console.log(`${i + 1}. ${chat.title} (ID: ${chat.id})`);
                    });
                    break;
                    
                case '3':
                    const chatId = await question('Enter chat ID or username: ');
                    const message = await question('Enter message: ');
                    await manager.sendMessage(client, chatId, message);
                    break;
                    
                case '4':
                    const readChatId = await question('Enter chat ID: ');
                    const messages = await manager.getMessages(client, readChatId);
                    console.log('\n📨 Recent Messages:');
                    messages.forEach(msg => {
                        console.log(`[${msg.date}] ${msg.text}`);
                    });
                    break;
                    
                case '5':
                    await client.disconnect();
                    console.log('👋 Goodbye!');
                    rl.close();
                    return;
                    
                default:
                    console.log('❌ Invalid choice');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        rl.close();
    }
}

main();