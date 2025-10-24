import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/database.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Import Routes
import authRoutes from "./routes/authRoutes.js";

/**
 * ============================================
 * LOAD ENVIRONMENT VARIABLES
 * ============================================
 */
dotenv.config();

/**
 * ============================================
 * CONNECT TO MONGODB
 * ============================================
 */
connectDB();

/**
 * ============================================
 * INITIALIZE EXPRESS APP
 * ============================================
 */
const app = express();

/**
 * ============================================
 * GLOBAL MIDDLEWARE
 * ============================================
 *
 * Order matters! These run for every request.
 */

// 1. CORS - Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// 2. Body Parser - Parse JSON request bodies
app.use(express.json());

// 3. URL Encoded - Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// 4. Request Logger (Development Only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

/**
 * ============================================
 * API ROUTES
 * ============================================
 *
 * Mount all route modules here
 * Base path: /api/{resource}
 */

// Health Check Route (useful for monitoring/deployment)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// TODO: Add more routes as you build them
// app.use('/api/metrics', metricsRoutes);
// app.use('/api/analytics', analyticsRoutes);

/**
 * ============================================
 * ERROR HANDLING MIDDLEWARE
 * ============================================
 *
 * MUST be registered AFTER all routes
 * Order: 404 handler → Error handler
 */

// 404 Handler - Catches undefined routes
app.use(notFound);

// Centralized Error Handler - Catches all errors
app.use(errorHandler);

/**
 * ============================================
 * START SERVER
 * ============================================
 */
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log("\n========================================");
  console.log("🚀 SERVER STARTED SUCCESSFULLY");
  console.log("========================================");
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Port: ${PORT}`);
  console.log(`Base URL: http://localhost:${PORT}`);
  console.log("\n📍 Available Endpoints:");
  console.log("  • Health Check: GET /api/health");
  console.log("  • Register: POST /api/auth/register");
  console.log("  • Login: POST /api/auth/login");
  console.log("  • Get User: GET /api/auth/me");
  console.log("  • Update Profile: PUT /api/auth/profile");
  console.log("  • Logout: POST /api/auth/logout");
  console.log("========================================\n");
});

/**
 * ============================================
 * GRACEFUL SHUTDOWN
 * ============================================
 *
 * Handle server shutdown gracefully
 */
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

export default app;
