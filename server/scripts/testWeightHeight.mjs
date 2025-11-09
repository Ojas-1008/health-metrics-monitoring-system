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

async function testWeightHeightFetch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const user = await User.findOne({ email: "ojasshrivastava1008@gmail.com" });
    if (!user) {
      console.log("❌ User not found");
      return;
    }

    const accessToken = user.googleFitTokens.access_token;
    
    // Fetch weight data
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const startTimeNanos = thirtyDaysAgo * 1000000;
    const endTimeNanos = Date.now() * 1000000;

    console.log("📅 Fetch Window:");
    console.log("  Start:", new Date(thirtyDaysAgo).toISOString());
    console.log("  End:", new Date().toISOString());
    console.log();

    // Weight
    console.log("⚖️  Fetching WEIGHT data...");
    try {
      const weightResponse = await axios.post(
        "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
        {
          aggregateBy: [
            {
              dataSourceId: "derived:com.google.weight:com.google.android.gms:merge_weight",
            },
          ],
          bucketByTime: { durationMillis: 86400000 }, // 1 day
          startTimeMillis: Math.floor(thirtyDaysAgo),
          endTimeMillis: Date.now(),
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const weightBuckets = weightResponse.data.bucket || [];
      console.log(`  📦 Total buckets: ${weightBuckets.length}`);
      
      weightBuckets.forEach((bucket) => {
        const startDate = new Date(parseInt(bucket.startTimeMillis));
        const points = bucket.dataset?.[0]?.point || [];
        
        if (points.length > 0) {
          points.forEach((point) => {
            const weightKg = point.value?.[0]?.fpVal;
            const timestamp = new Date(parseInt(point.startTimeNanos) / 1000000);
            console.log(`    ✓ ${startDate.toISOString().split('T')[0]}: ${weightKg} kg (at ${timestamp.toISOString()})`);
          });
        }
      });
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
    }

    console.log();

    // Height
    console.log("📏 Fetching HEIGHT data...");
    try {
      const heightResponse = await axios.post(
        "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
        {
          aggregateBy: [
            {
              dataSourceId: "derived:com.google.height:com.google.android.gms:merge_height",
            },
          ],
          bucketByTime: { durationMillis: 86400000 }, // 1 day
          startTimeMillis: Math.floor(thirtyDaysAgo),
          endTimeMillis: Date.now(),
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const heightBuckets = heightResponse.data.bucket || [];
      console.log(`  📦 Total buckets: ${heightBuckets.length}`);
      
      heightBuckets.forEach((bucket) => {
        const startDate = new Date(parseInt(bucket.startTimeMillis));
        const points = bucket.dataset?.[0]?.point || [];
        
        if (points.length > 0) {
          points.forEach((point) => {
            const heightM = point.value?.[0]?.fpVal;
            const timestamp = new Date(parseInt(point.startTimeNanos) / 1000000);
            console.log(`    ✓ ${startDate.toISOString().split('T')[0]}: ${heightM} m (${Math.round(heightM * 100)} cm) (at ${timestamp.toISOString()})`);
          });
        }
      });
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testWeightHeightFetch();
