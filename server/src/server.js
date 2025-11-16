import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/database.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import healthMetricsRoutes from "./routes/healthMetricsRoutes.js";
import goalsRoutes from "./routes/goalsRoutes.js";
import googleFitRoutes from "./routes/googleFitRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js"; // SSE routes
import analyticsRoutes from "./routes/analyticsRoutes.js"; // Analytics routes

// Import Models (for index creation on startup)
import Analytics from "./models/Analytics.js"; // ⬅️ ADD THIS LINE

// Import Workers
import { startSyncWorker, triggerManualSync } from "../workers/googleFitSyncWorker.js";
import { startChangeStreamWorker } from "../workers/changeStreamWorker.js"; // ← NEW

/**
 * ============================================
 * LOAD ENVIRONMENT VARIABLES
 * ============================================
 */
dotenv.config();

/**
 * ============================================
 * CONFIGURATION
 * ============================================
 */
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

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
    origin: CLIENT_URL,
    credentials: true,
  })
);

// 2. Body Parser - Parse JSON request bodies
app.use(express.json());

// 3. URL Encoded - Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// 4. Request Logger (Development Only)
if (NODE_ENV === "development") {
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
    environment: NODE_ENV,
    mongooseState: mongoose.connection.readyState,
    mongooseStateName: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]
  });
});

// Manual Sync Trigger Route (for testing)
app.get("/api/sync/trigger", async (req, res) => {
  try {
    const results = await triggerManualSync();
    res.status(200).json({
      success: true,
      message: "Sync completed",
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// Health Metrics Routes
app.use("/api/metrics", healthMetricsRoutes);

// Goals Routes
app.use("/api/goals", goalsRoutes);

// Google Fit OAuth Routes
app.use("/api/googlefit", googleFitRoutes);

// ===== NEW: Server-Sent Events Routes =====
app.use("/api/events", eventsRoutes);

// ===== NEW: Analytics Routes =====
app.use("/api/analytics", analyticsRoutes);

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
 * ASYNC INITIALIZATION FUNCTION
 * ============================================
 * 
 * Ensures proper sequencing of:
 * 1. MongoDB connection
 * 2. Worker initialization (after DB is ready)
 * 3. Server startup
 */
const initializeServer = async () => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 INITIALIZING HEALTH METRICS SERVER");
    console.log("=".repeat(60));

    // ===== STEP 1: Connect to MongoDB =====
    console.log("\n📡 Step 1: Connecting to MongoDB...");
    await connectDB();
    
    // Verify connection is established
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not in "connected" state');
    }
    
    console.log("✅ MongoDB connection verified");
    console.log(`   State: ${mongoose.connection.readyState} (connected)`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);

    // ===== STEP 2: Start Workers =====
    console.log("\n⚙️  Step 2: Starting background workers...");

    // Start Google Fit sync worker (cron-based)
    console.log("   → Starting Google Fit Sync Worker...");
    startSyncWorker();
    console.log("   ✅ Google Fit Sync Worker started (cron schedule)");

    // ===== NEW: Start MongoDB Change Stream Worker =====
    // Add a small delay to ensure MongoDB connection is fully stabilized
    console.log("   → Starting MongoDB Change Stream Worker...");
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second stabilization delay
    
    await startChangeStreamWorker();
    console.log("   ✅ MongoDB Change Stream Worker started");
    console.log("   🔄 MongoDB Change Stream Worker started");

    // ===== STEP 3: Start Express Server =====
    console.log("\n🌐 Step 3: Starting HTTP server...");
    
    const server = app.listen(PORT, () => {
      console.log("\n" + "=".repeat(60));
      console.log("🚀 SERVER STARTED SUCCESSFULLY");
      console.log("=".repeat(60));
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Port: ${PORT}`);
      console.log(`Base URL: http://localhost:${PORT}`);
      console.log(`Client URL: ${CLIENT_URL}`);
      
      console.log("\n📍 Available Endpoints:");
      console.log(" • Health Check: GET /api/health");
      console.log(" • Manual Sync: GET /api/sync/trigger");
      
      console.log("\n🔐 Authentication:");
      console.log(" - Register: POST /api/auth/register");
      console.log(" - Login: POST /api/auth/login");
      console.log(" - Get User: GET /api/auth/me");
      console.log(" - Update Profile: PUT /api/auth/profile");
      console.log(" - Logout: POST /api/auth/logout");
      
      console.log("\n📊 Health Metrics:");
      console.log(" - Add/Update Metrics: POST /api/metrics");
      console.log(" - Get by Range: GET /api/metrics?startDate=...&endDate=...");
      console.log(" - Get by Date: GET /api/metrics/:date");
      console.log(" - Delete: DELETE /api/metrics/:date");
      console.log(" - Summary: GET /api/metrics/summary/:period");
      console.log(" - Latest: GET /api/metrics/latest");
      
      console.log("\n🎯 Goals:");
      console.log(" - Set Goals: POST /api/goals");
      console.log(" - Get Goals: GET /api/goals");
      console.log(" - Update Goals: PUT /api/goals");
      console.log(" - Reset Goals: DELETE /api/goals");
      console.log(" - Get Progress: GET /api/goals/progress");
      
      console.log("\n🔗 Google Fit OAuth:");
      console.log(" - Initiate: GET /api/googlefit/connect");
      console.log(" - Callback: GET /api/googlefit/callback");
      console.log(" - Status: GET /api/googlefit/status");
      console.log(" - Disconnect: POST /api/googlefit/disconnect");
      
      console.log("\n🔔 Real-Time Events (SSE):");
      console.log(" - Event Stream: GET /api/events/stream");
      console.log(" - Debug Connections: GET /api/events/debug/connections");
      console.log(" - Test Event: POST /api/events/debug/test");
      
      console.log("\n📈 Analytics:");
      console.log(" - Latest Analytics: GET /api/analytics/latest/:metricType");
      console.log(" - All Analytics: GET /api/analytics");
      console.log(" - Analytics Summary: GET /api/analytics/summary");
      console.log(" - Anomalies: GET /api/analytics/anomalies");
      console.log(" - By ID: GET /api/analytics/:id");
      console.log(" - Delete: DELETE /api/analytics/:id");
      
      console.log("\n⚙️  Background Workers:");
      console.log(" ✅ Google Fit Sync: Active (every 15 minutes)");
      console.log(" ✅ Change Stream: Active (real-time)");
      console.log(" ✅ Analytics Processing: Active (via Apache Spark)");
      
      console.log("=".repeat(60) + "\n");
    });

    /**
     * ============================================
     * GRACEFUL SHUTDOWN HANDLER
     * ============================================
     * 
     * Handle server shutdown gracefully
     * Closes change stream before shutting down
     */
    const gracefulShutdown = async (signal) => {
      console.log(`\n👋 ${signal} signal received: initiating graceful shutdown`);
      
      // Stop accepting new connections
      server.close(async () => {
        console.log("✓ HTTP server closed");
        
        // Close change stream worker
        try {
          const { stopChangeStreamWorker } = await import("../workers/changeStreamWorker.js");
          await stopChangeStreamWorker();
          console.log("✓ Change stream worker stopped");
        } catch (error) {
          console.error("Error stopping change stream worker:", error.message);
        }
        
        // Close MongoDB connection
        try {
          await mongoose.connection.close();
          console.log("✓ MongoDB connection closed");
        } catch (error) {
          console.error("Error closing MongoDB connection:", error.message);
        }
        
        console.log("👋 Graceful shutdown complete");
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        console.error("❌ Graceful shutdown timeout, forcing exit");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ SERVER INITIALIZATION FAILED");
    console.error("=".repeat(60));
    console.error(`Error: ${error.message}`);
    console.error(`Stack trace:`, error.stack);
    console.error("=".repeat(60) + "\n");
    process.exit(1);
  }
};

/**
 * ============================================
 * START INITIALIZATION
 * ============================================
 */
initializeServer();

export default app;
