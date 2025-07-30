const express = require('express');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const client = require('../bot/client');

const router = express.Router();

// Environment variables
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const API_SECRET = process.env.API_SECRET;

if (!DISCORD_CHANNEL_ID || !API_SECRET) {
    console.error('Error: Missing DISCORD_CHANNEL_ID or API_SECRET environment variables');
    process.exit(1);
}

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
router.post('/svincolato', authenticateToken, validatePlayerData, async (req, res) => {
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

module.exports = router;