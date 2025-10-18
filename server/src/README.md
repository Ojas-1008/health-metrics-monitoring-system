# Server Source Code

This directory contains all backend application code organized by responsibility.

## Directory Structure

- `config/` - Configuration files (database, API keys)
- `controllers/` - HTTP request handlers
- `models/` - MongoDB schemas and database models
- `routes/` - API endpoint definitions
- `middleware/` - Custom Express middleware (auth, validation)
- `services/` - Business logic and external API integrations
- `utils/` - Helper functions and utilities
- `server.js` - Application entry point

## Architecture Pattern

This project follows a layered MVC architecture with separation of concerns:

**Request Flow:**

**Each layer's responsibility:**
- **Routes**: Define endpoints and attach middleware
- **Middleware**: Authenticate, validate, log
- **Controllers**: Handle request/response, call services
- **Services**: Implement business logic
- **Models**: Define data structure, interact with DB
