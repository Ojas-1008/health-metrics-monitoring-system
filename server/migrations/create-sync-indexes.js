/**
 * server/migrations/create-sync-indexes.js
 * 
 * Mongoose migration script to create indexes for Google Fit sync operations
 * 
 * Usage:
 *   node server/migrations/create-sync-indexes.js
 * 
 * Safe to run multiple times - Mongoose handles idempotent index creation
 */

import mongoose from "mongoose";
import User from "../src/models/User.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/health_metrics";

/**
 * Index creation with error handling and logging
 */
async function createIndexes() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n📊 Creating indexes for User model...");

    // Get collection
    const collection = User.collection;

    // Display existing indexes
    const indexes = await collection.getIndexes();
    console.log("\n📑 Existing indexes:");
    Object.entries(indexes).forEach(([name, spec]) => {
      console.log(`  - ${name}:`, spec);
    });

    // User model indexes are created automatically on schema compilation
    // Explicitly sync indexes with database
    await User.syncIndexes();
    console.log("\n✅ All indexes created/verified successfully!");

    // Get updated index list
    const updatedIndexes = await collection.getIndexes();
    console.log("\n📑 Final indexes:");
    Object.entries(updatedIndexes).forEach(([name, spec]) => {
      console.log(`  - ${name}:`, spec);
    });

    // Log index stats
    const indexStats = await collection.indexInformation();
    console.log("\n📈 Index Statistics:");
    console.log(`Total indexes: ${Object.keys(indexStats).length}`);

    // Highlight key sync indexes
    const syncIndexes = [
      "active_google_fit_users",
      "googleid_1",
      "googlefitconnected_1",
    ];
    console.log("\n🔄 Sync-specific indexes:");
    syncIndexes.forEach((indexName) => {
      const exists = Object.keys(indexStats).some((key) =>
        key.includes(indexName.replace(/_/g, ""))
      );
      console.log(`  ${exists ? "✅" : "❌"} ${indexName}`);
    });

    // Index performance insights
    console.log("\n💡 Index Performance Tips:");
    console.log("  - googleFitConnected index: Fast filtering of connected users");
    console.log("  - token_expiry index: Efficient token cleanup queries");
    console.log("  - Compound index: Optimizes sync worker queries");

    await mongoose.disconnect();
    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

createIndexes();
