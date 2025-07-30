# Discord Bot API Service

## Overview

This project is a Discord bot API service that combines an Express.js web server with a Discord bot client, refactored with modular architecture for Render hosting. The application provides webhook-style endpoints for external services to send notifications to Discord channels through a bot interface. It uses Express.js for the REST API layer and Discord.js v14 for Discord integration.

## User Preferences

Preferred communication style: Simple, everyday language.
Language: Italian

## System Architecture

The application follows a modular architecture optimized for Render hosting with three main components:

1. **bot/client.js**: Discord client module with automatic login and graceful shutdown handling
2. **server/webhook.js**: Express router module with authentication, validation, and Discord messaging logic
3. **index.js**: Entry point that imports modules and starts the Express server

The modular design enables better code organization, easier testing, and improved compatibility with cloud hosting platforms like Render.

## Key Components

### Web Server (Express.js)
- **Purpose**: Provides HTTP endpoints for external integrations
- **Port**: Dynamic port via process.env.PORT || 5000 (Render compatible)
- **Authentication**: Bearer token-based authentication using API_SECRET
- **Middleware**: JSON parsing and custom authentication middleware
- **Routing**: Modular Express router system for better organization

### Discord Bot Client
- **Framework**: Discord.js v14
- **Intents**: Minimal intents (Guilds, GuildMessages) for basic functionality
- **Features**: Message posting, embed creation, interactive buttons
- **Connection**: Single persistent gateway connection

### Authentication System
- **Method**: Bearer token authentication
- **Implementation**: Custom middleware validates Authorization header
- **Security**: Compares provided token against API_SECRET environment variable

## Data Flow

1. External service sends HTTP request to Express endpoint
2. Authentication middleware validates Bearer token
3. Request data is processed and formatted for Discord
4. Discord bot client sends message to specified channel
5. Response sent back to requesting service

The flow is synchronous and stateless, with no persistent data storage between requests.

## External Dependencies

### Core Dependencies
- **express**: Web server framework (v5.1.0)
- **discord.js**: Discord API library (v14.21.0) 
- **dotenv**: Environment variable management (v17.2.1)

### Environment Variables
- `BOT_TOKEN`: Discord bot authentication token
- `DISCORD_CHANNEL_ID`: Target Discord channel for messages
- `API_SECRET`: Bearer token for API authentication

### External Services
- **Discord API**: Primary integration for message delivery
- **Discord Gateway**: Real-time connection for bot functionality

## Deployment Strategy

### Environment Setup
- Node.js runtime required (v16.11.0+ per Discord.js requirements)
- Environment variables must be configured before startup
- Application validates all required environment variables at startup

### Process Management
- Single process application
- Graceful error handling for missing configuration
- Automatic process exit on configuration errors

### Scaling Considerations
- Stateless design allows horizontal scaling
- Discord rate limits may require request queuing for high-volume scenarios
- Single Discord bot token limits concurrent connections to one per application instance

### Monitoring
- Basic console logging for bot connection status
- Error logging for authentication failures
- Environment validation logging at startup

The deployment strategy prioritizes simplicity and reliability, with specific optimizations for Render hosting including dynamic port configuration and modular architecture for better maintainability.

## Recent Changes

### July 30, 2025 - Modular Refactoring for Render
- Refactored monolithic index.js into modular structure:
  - `bot/client.js`: Isolated Discord client with connection management
  - `server/webhook.js`: Express router with webhook handling logic
  - `index.js`: Clean entry point importing and starting modules
- Updated port configuration to use `process.env.PORT || 5000` for Render compatibility
- Enhanced package.json with proper start script and metadata
- Updated README.md with Render deployment instructions
- All files synchronized to GitHub repository for seamless deployment