import dotenv from 'dotenv';
import connectDB from './config/database.js';
import app from './app.js';

// Load environment variables
dotenv.config();

// Define PORT
const PORT = process.env.PORT || 5000;

// Connect to Database and Start Server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start Express server only after successful DB connection
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
