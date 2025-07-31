const express = require('express');
const router = express.Router();
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require('discord.js');

const client = require('../bot/client');

const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const API_SECRET = process.env.API_SECRET?.trim(); // ✅ Sanitize token

// 🔐 Middleware di autenticazione
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]?.trim();

  console.log('🧪 Token ricevuto:', token);
  console.log('🔐 Token atteso:', API_SECRET);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header with Bearer token required',
    });
  }

  if (token !== API_SECRET) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API token',
    });
  }

  next();
};

// ✅ Middleware per validazione payload
const validatePlayerData = (req, res, next) => {
  const { userId, username, previousTeamId, previousTeamName, timestamp, action, reason } = req.body;

  const requiredFields = ['userId', 'username', 'previousTeamId', 'previousTeamName', 'timestamp', 'action', 'reason'];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required fields',
      missingFields: missingFields,
    });
  }

  if (!['player_released', 'removed_by_captain', 'voluntary_leave'].includes(action)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid action. Expected one of: player_released, removed_by_captain, voluntary_leave',
    });
  }

  const timestampDate = new Date(timestamp);
  if (isNaN(timestampDate.getTime())) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid timestamp format. Expected ISO 8601 format',
    });
  }

  next();
};

// 📩 POST /svincolato
router.post('/svincolato', authenticateToken, validatePlayerData, async (req, res) => {
  try {
    const { userId, username, previousTeamName, timestamp, reason } = req.body;

    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);

    if (!channel) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Discord channel not found',
      });
    }

    const formattedDate = new Date(timestamp).toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    let reasonDescription;
    switch (reason) {
      case 'voluntary_leave':
        reasonDescription = 'Giocatore ha lasciato volontariamente la squadra';
        break;
      case 'removed_by_captain':
        reasonDescription = 'Giocatore rimosso dal capitano';
        break;
      default:
        reasonDescription = reason;
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('🆓 Giocatore svincolato!')
      .addFields(
        { name: '👤 Giocatore', value: username, inline: true },
        { name: '🏟️ Ex Team', value: previousTeamName, inline: true },
        { name: '📄 Motivo', value: reasonDescription, inline: false },
        { name: '📅 Data', value: formattedDate, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Ultimate Pro Clubs' });

    const button = new ButtonBuilder()
      .setLabel('Visualizza giocatore')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://app.ultimateproclubs.com/player/${userId}`);

    const row = new ActionRowBuilder().addComponents(button);

    await channel.send({ embeds: [embed], components: [row] });

    console.log(`✅ Notifica inviata per ${username} (ID: ${userId})`);

    return res.status(200).json({
      success: true,
      message: 'Webhook Discord inviato con successo',
    });
  } catch (error) {
    console.error('❌ Errore nel webhook:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Errore durante l’invio su Discord',
      details: error.message,
    });
  }
});

module.exports = router;
