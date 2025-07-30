# UPC Discord Bot

Bot Discord per webhook di notifiche dei giocatori svincolati di Ultimate Pro Clubs, ottimizzato per hosting su Render.

## 🚀 Deploy su Render

### Configurazione rapida:
1. Fork questo repository
2. Connetti a Render come Web Service
3. Configura le variabili d'ambiente:
   - `BOT_TOKEN` - Token del bot Discord  
   - `DISCORD_CHANNEL_ID` - ID del canale Discord per le notifiche
   - `API_SECRET` - Chiave segreta per l'autenticazione webhook
4. Deploy automatico!

### Struttura del progetto:
```
/
├── bot/client.js              ← Client Discord con login automatico
├── server/webhook.js         ← Route POST /svincolato con validazione
├── index.js                  ← Entry point, avvia Express server
├── .env.example              ← Template variabili ambiente
└── package.json              ← Dipendenze e script
```

## 🔧 Funzionalità

- ✅ Bot Discord sempre online (hosting persistente Render)
- ✅ Server Express.js per ricevere webhook
- ✅ Autenticazione Bearer token
- ✅ Messaggi Discord con embed e pulsanti interattivi
- ✅ Supporto per diversi tipi di svincolamento:
  - `player_released` - Giocatore rilasciato
  - `voluntary_leave` - Uscita volontaria  
  - `removed_by_captain` - Rimosso dal capitano

## 🛠 Sviluppo locale

```bash
npm install
npm start
```

## 📡 API Endpoint

### Webhook Svincolamento
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

**Headers:**
```
Authorization: Bearer {API_SECRET}
Content-Type: application/json
```

### Health Check
**GET** `/health` - Stato server e connessione bot

## 🔐 Variabili d'ambiente richieste

Su Render, configura queste variabili nel dashboard:

- `BOT_TOKEN=` Token bot Discord
- `DISCORD_CHANNEL_ID=` ID canale Discord  
- `API_SECRET=` Chiave webhook
- `PORT=` Auto-configurato da Render