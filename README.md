# UPC Discord Bot

Bot Discord per webhook di notifiche dei giocatori svincolati di Ultimate Pro Clubs.

## Funzionalità

- 🔗 Server Express.js per ricevere webhook
- 🤖 Bot Discord integrato per inviare notifiche
- 🔐 Autenticazione Bearer token
- 📊 Messaggi Discord formattati con embed e pulsanti interattivi
- ✅ Supporto per diversi tipi di svincolamento:
  - `player_released` - Giocatore rilasciato
  - `voluntary_leave` - Uscita volontaria
  - `removed_by_captain` - Rimosso dal capitano

## Configurazione

1. Crea un file `.env` basato su `.env.example`
2. Configura le variabili d'ambiente:
   - `BOT_TOKEN` - Token del bot Discord
   - `DISCORD_CHANNEL_ID` - ID del canale Discord per le notifiche
   - `API_SECRET` - Chiave segreta per l'autenticazione webhook

## Utilizzo

```bash
npm install
node index.js
```

Il server sarà disponibile sulla porta 5000.

### Endpoint Webhook

**POST** `/svincolato`

```json
{
  "userId": 1029,
  "username": "D3nnys_Gatto10",
  "previousTeamId": 17,
  "previousTeamName": "Alice in wonderland",
  "timestamp": "2025-07-30T11:10:15.913Z",
  "action": "voluntary_leave",
  "reason": "voluntary_leave"
}
```

**Headers richiesti:**
```
Authorization: Bearer {API_SECRET}
Content-Type: application/json
```

## Health Check

**GET** `/health` - Verifica lo stato del server e della connessione bot.