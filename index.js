onst express = require('express');
require('dotenv').config();

// Import modules
const client = require('./bot/client');
const webhookRoutes = require('./server/webhook');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.use('/', webhookRoutes);

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
    console.log(Express server running on http://0.0.0.0:${PORT});
    console.log(Webhook endpoint available at: POST http://0.0.0.0:${PORT}/svincolato);
});
