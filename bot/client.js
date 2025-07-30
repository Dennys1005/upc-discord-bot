const { Client, GatewayIntentBits } = require('discord.js');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// Discord bot ready event
client.once('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag}!`);
});

// Environment variables validation
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('Error: Missing BOT_TOKEN environment variable');
    process.exit(1);
}

// Login to Discord
client.login(BOT_TOKEN).catch(error => {
    console.error('Failed to login to Discord:', error);
    process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Gracefully shutting down...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Gracefully shutting down...');
    client.destroy();
    process.exit(0);
});

module.exports = client;