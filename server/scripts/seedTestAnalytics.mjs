import dotenv from "dotenv";
import mongoose from "mongoose";
import Analytics from "../src/models/Analytics.js";
import User from "../src/models/User.js";

const EMAIL = "ojasshrivastava1008@gmail.com";

async function seedAnalytics() {
  dotenv.config();

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/health-metrics";
  console.log(`\n🔌 Connecting to MongoDB: ${uri}`);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log("✅ MongoDB connection established\n");

  const user = await User.findOne({ email: EMAIL }).select("_id email");
  if (!user) {
    throw new Error(`User with email ${EMAIL} not found. Cannot seed analytics.`);
  }

  console.log(`👤 Seeding analytics for user ${user.email} (${user._id})\n`);

  const now = new Date();
  const expiration = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const documents = [
    {
      userId: user._id,
      metricType: "steps",
      timeRange: "7day",
      analytics: {
        rollingAverage: 8500,
        trend: "up",
        trendPercentage: 12.5,
        anomalyDetected: false,
        streakDays: 5,
        longestStreak: 12,
        streakStartDate: new Date("2025-11-11"),
        percentile: 75,
        comparisonToPrevious: {
          absoluteChange: 1000,
          percentageChange: 13.3,
          isImprovement: true,
        },
        statistics: {
          standardDeviation: 1200,
          minValue: 5000,
          maxValue: 12000,
          medianValue: 8300,
          dataPointsCount: 7,
          completenessPercentage: 100,
        },
      },
      calculatedAt: now,
      expiresAt: expiration,
      metadata: {
        sparkJobId: "test-job-001",
        processingDurationMs: 1500,
        dataPointsProcessed: 7,
        sparkVersion: "3.5.0",
      },
    },
    {
      userId: user._id,
      metricType: "calories",
      timeRange: "7day",
      analytics: {
        rollingAverage: 2100,
        trend: "stable",
        trendPercentage: 2.0,
        anomalyDetected: true,
        anomalyDetails: {
          severity: "high",
          actualValue: 4500,
          expectedValue: 2100,
          deviation: 3.2,
          message: "Calories 114% above average for this period",
          detectedAt: now,
        },
        streakDays: 3,
        longestStreak: 8,
        percentile: 60,
        comparisonToPrevious: {
          absoluteChange: 50,
          percentageChange: 2.4,
          isImprovement: true,
        },
        statistics: {
          standardDeviation: 300,
          minValue: 1800,
          maxValue: 4500,
          medianValue: 2050,
          dataPointsCount: 7,
          completenessPercentage: 100,
        },
      },
      calculatedAt: now,
      expiresAt: expiration,
    },
  ];

  const result = await Analytics.insertMany(documents);
  console.log(`✅ Inserted ${result.length} analytics documents.`);

  result.forEach((doc) => {
    console.log(` • ${doc.metricType} (${doc.timeRange}) → ${doc._id}`);
  });

  await mongoose.connection.close();
  console.log("\n🔒 MongoDB connection closed\n");
}

seedAnalytics().catch((error) => {
  console.error("❌ Failed to seed analytics data:", error.message);
  mongoose.connection.close();
  process.exit(1);
});
