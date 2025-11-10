import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/database.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import healthMetricsRoutes from "./routes/healthMetricsRoutes.js";
import goalsRoutes from "./routes/goalsRoutes.js";
import googleFitRoutes from "./routes/googleFitRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js"; // ← NEW: SSE routes

// Import Workers
import { startSyncWorker } from "../workers/googleFitSyncWorker.js";
import { triggerManualSync } from "../workers/googleFitSyncWorker.js";

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
 * START GOOGLE FIT SYNC WORKER
 * ============================================
 * Automatically syncs Google Fit data every 15 minutes
 */
startSyncWorker();

/**
 * ============================================
 * INITIALIZE EXPRESS APP
 * ============================================
 */
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

/**
 * ============================================
 * CORS CONFIGURATION
 * ============================================
 * Allow requests from the React frontend
 */
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // Allow cookies and authorization headers
  })
);

/**
 * ============================================
 * BODY PARSING MIDDLEWARE
 * ============================================
 */
app.use(express.json()); // Parse JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded payloads

/**
 * ============================================
 * REQUEST LOGGING MIDDLEWARE (Development only)
 * ============================================
 */
if (NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

/**
 * ============================================
 * HEALTH CHECK ROUTES
 * ============================================
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Health Metrics API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * ============================================
 * MANUAL SYNC TRIGGER (Development/Testing)
 * ============================================
 */
app.get("/api/sync/trigger", async (req, res) => {
  try {
    console.log("[Manual Sync] Triggering immediate Google Fit sync...");
    await triggerManualSync();
    res.status(200).json({
      success: true,
      message: "Manual sync triggered successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Manual Sync] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger manual sync",
      error: error.message,
    });
  }
});

/**
 * ============================================
 * REGISTER API ROUTES
 * ============================================
 *
 * Route Registration Order:
 * 1. /api/auth - Authentication & user management
 * 2. /api/metrics - Health metrics CRUD operations
 * 3. /api/goals - Fitness goals management
 * 4. /api/googlefit - Google Fit OAuth & sync
 * 5. /api/events - Server-Sent Events (SSE) for real-time updates ← NEW
 *
 * IMPORTANT: Error handlers MUST be registered AFTER all routes
 */
app.use("/api/auth", authRoutes);
console.log("✓ Registered route: /api/auth");

app.use("/api/metrics", healthMetricsRoutes);
console.log("✓ Registered route: /api/metrics");

app.use("/api/goals", goalsRoutes);
console.log("✓ Registered route: /api/goals");

app.use("/api/googlefit", googleFitRoutes);
console.log("✓ Registered route: /api/googlefit");

// ===== NEW: Register SSE Routes =====
app.use("/api/events", eventsRoutes);
console.log("✓ Registered route: /api/events (Server-Sent Events)");

/**
 * ============================================
 * ERROR HANDLING MIDDLEWARE
 * ============================================
 * MUST be registered AFTER all routes
 */
app.use(notFound); // 404 handler for undefined routes
app.use(errorHandler); // Centralized error handler

/**
 * ============================================
 * START SERVER
 * ============================================
 */
const server = app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 HEALTH METRICS SERVER STARTED");
  console.log("=".repeat(60));
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`🌐 Client URL: ${CLIENT_URL}`);
  console.log(`📊 MongoDB: Connected`);
  console.log(`⏱️  Google Fit Sync: Every 15 minutes`);
  console.log(`🔔 SSE Endpoint: /api/events/stream`); // ← NEW
  console.log("=".repeat(60) + "\n");
});

/**
 * ============================================
 * GRACEFUL SHUTDOWN HANDLER
 * ============================================
 */
process.on("SIGTERM", () => {
  console.log("\n[Server] SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("[Server] HTTP server closed");
    process.exit(0);
  });
});

export default app;
