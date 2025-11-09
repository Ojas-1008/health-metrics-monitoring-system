import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../.env") });

const User = mongoose.model(
  "User",
  new mongoose.Schema({}, { strict: false }),
  "users"
);

async function testRawWeightData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const user = await User.findOne({ email: "ojasshrivastava1008@gmail.com" });
    if (!user) {
      console.log("❌ User not found");
      return;
    }

    const accessToken = user.googleFitTokens.access_token;
    
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const startTimeNanos = thirtyDaysAgo * 1000000;
    const endTimeNanos = Date.now() * 1000000;

    console.log("📅 Fetch Window:");
    console.log("  Start:", new Date(thirtyDaysAgo).toISOString());
    console.log("  End:", new Date().toISOString());
    console.log();

    // Use DATASETS API (like sync worker does)
    const weightDataSourceId = "derived:com.google.weight:com.google.android.gms:merge_weight";
    const url = `https://www.googleapis.com/fitness/v1/users/me/dataSources/${weightDataSourceId}/datasets/${startTimeNanos}-${endTimeNanos}`;

    console.log("⚖️  Fetching WEIGHT data using datasets API...");
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const points = response.data.point || [];
      console.log(`  📦 Total raw data points: ${points.length}\n`);
      
      points.forEach((point, index) => {
        const startTimeMs = parseInt(point.startTimeNanos) / 1000000;
        const endTimeMs = parseInt(point.endTimeNanos) / 1000000;
        const weightKg = point.value?.[0]?.fpVal;
        
        const startDate = new Date(startTimeMs);
        const endDate = new Date(endTimeMs);
        
        // Simulate sync worker's aggregation logic
        const aggregationDate = new Date(endTimeMs);
        aggregationDate.setUTCHours(0, 0, 0, 0);
        const dayKey = aggregationDate.toISOString().split("T")[0];
        
        console.log(`  Point ${index + 1}:`);
        console.log(`    Weight: ${weightKg} kg`);
        console.log(`    startTimeNanos: ${point.startTimeNanos}`);
        console.log(`    endTimeNanos: ${point.endTimeNanos}`);
        console.log(`    Start time: ${startDate.toISOString()}`);
        console.log(`    End time: ${endDate.toISOString()}`);
        console.log(`    🔑 Aggregation dayKey: "${dayKey}"`);
        console.log();
      });
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`    Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testRawWeightData();
