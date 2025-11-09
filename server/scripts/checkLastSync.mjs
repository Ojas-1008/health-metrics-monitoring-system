import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../.env") });

const User = mongoose.model(
  "User",
  new mongoose.Schema({}, { strict: false }),
  "users"
);

async function checkLastSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const user = await User.findOne(
      { email: "ojasshrivastava1008@gmail.com" },
      { lastSyncAt: 1, googleFitConnected: 1 }
    );

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("\n📅 Sync Timestamps:");
    console.log("lastSyncAt:", user.lastSyncAt);
    console.log("googleFitConnected:", user.googleFitConnected);
    console.log("\nCurrent time:", new Date().toISOString());
    
    if (user.lastSyncAt) {
      const hoursSince = (Date.now() - user.lastSyncAt.getTime()) / (1000 * 60 * 60);
      console.log(`Hours since last sync: ${hoursSince.toFixed(2)}`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkLastSync();
