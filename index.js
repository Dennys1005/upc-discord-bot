const express = require('express');
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const app = express();
const PORT = 5000; // Using port 5000 as per system requirements

// Middleware
app.use(express.json());

// Environment variables validation
const BOT_TOKEN = process.env.BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const API_SECRET = process.env.API_SECRET;

if (!BOT_TOKEN || !DISCORD_CHANNEL_ID || !API_SECRET) {
    console.error('Error: Missing required environment variables. Please check BOT_TOKEN, DISCORD_CHANNEL_ID, and API_SECRET in your .env file');
    process.exit(1);
}

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

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: 'Unauthorized', 
            message: 'Authorization header with Bearer token required' 
        });
    }

    if (token !== API_SECRET) {
        return res.status(403).json({ 
            error: 'Forbidden', 
            message: 'Invalid API token' 
        });
    }

    next();
};

// Validation middleware for player release data
const validatePlayerData = (req, res, next) => {
    const { userId, username, previousTeamId, previousTeamName, timestamp, action, reason } = req.body;
    
    const requiredFields = ['userId', 'username', 'previousTeamId', 'previousTeamName', 'timestamp', 'action', 'reason'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required fields',
            missingFields: missingFields
        });
    }

    if (!['player_released', 'removed_by_captain', 'voluntary_leave'].includes(action)) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid action. Expected one of: player_released, removed_by_captain, voluntary_leave'
        });
    }

    // Validate timestamp format
    const timestampDate = new Date(timestamp);
    if (isNaN(timestampDate.getTime())) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid timestamp format. Expected ISO 8601 format'
        });
    }

    next();
};

// POST endpoint for player release webhooks
app.post('/svincolato', authenticateToken, validatePlayerData, async (req, res) => {
    try {
        const { userId, username, previousTeamId, previousTeamName, timestamp, action, reason } = req.body;
        
        // Get the Discord channel
        const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
        
        if (!channel) {
            console.error(`Channel with ID ${DISCORD_CHANNEL_ID} not found`);
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'Discord channel not found'
            });
        }

        // Format the timestamp for display
        const releaseDate = new Date(timestamp);
        const formattedDate = releaseDate.toLocaleString('it-IT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Convert reason code to readable description
        let reasonDescription;
        switch (reason) {
            case 'voluntary_leave':
                reasonDescription = 'Giocatore ha lasciato volontariamente la squadra';
                break;
            case 'removed_by_captain':
                reasonDescription = 'Giocatore rimosso dal capitano della squadra';
                break;
            default:
                reasonDescription = reason; // Fallback to original value if unknown
        }

        // Create the embed message
        const embed = new EmbedBuilder()
            .setColor(0x00FF00) // Green color for player release
            .setTitle('🆓 **Giocatore svincolato!**')
            .addFields(
                { name: '👤 **Giocatore**', value: username, inline: true },
                { name: '🏟️ **Ex Team**', value: previousTeamName, inline: true },
                { name: '📄 **Motivo**', value: reasonDescription, inline: false },
                { name: '📅 **Data**', value: formattedDate, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Ultimate Pro Clubs' });

        // Create the button
        const button = new ButtonBuilder()
            .setLabel('Visualizza giocatore')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://app.ultimateproclubs.com/player/${userId}`);

        const row = new ActionRowBuilder()
            .addComponents(button);

        // Send the message to Discord
        await channel.send({
            embeds: [embed],
            components: [row]
        });

        console.log(`Player release notification sent for ${username} (ID: ${userId})`);
        
        res.status(200).json({
            success: true,
            message: 'Player release notification sent successfully',
            data: {
                userId,
                username,
                channelId: DISCORD_CHANNEL_ID
            }
        });

    } catch (error) {
        console.error('Error processing player release webhook:', error);
        
        if (error.code === 10003) {
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'Discord channel not found or bot lacks access'
            });
        }
        
        if (error.code === 50013) {
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'Bot lacks permission to send messages in the specified channel'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to send Discord notification',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Discord bot webhook server is running',
        timestamp: new Date().toISOString(),
        botStatus: client.isReady() ? 'Connected' : 'Disconnected'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'Endpoint not found'
    });
});

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
    console.log(`Webhook endpoint available at: POST http://0.0.0.0:${PORT}/svincolato`);
});

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
