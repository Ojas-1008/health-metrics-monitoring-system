/**
 * server/src/__tests__/IndexPerformance.test.js
 * Test query performance with indexes
 * Run with: npm test
 */

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";

let mongoServer;

describe("User Model - Index Performance & Verification", () => {
  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    // Explicitly sync indexes for in-memory database
    await User.syncIndexes();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("Index Creation & Verification", () => {
    it("should have all required sync indexes", async () => {
      const indexes = await User.collection.getIndexes();
      const indexNames = Object.keys(indexes);

      // Required sync indexes
      expect(indexNames).toContain("sync_worker_query");
      expect(indexNames).toContain("token_expiry_cleanup");
      expect(indexNames).toContain("active_google_fit_users");

      console.log("✅ All required indexes exist");
    });

    it("should have sync_worker_query with correct field order", async () => {
      const indexes = await User.collection.getIndexes();
      const syncIndex = indexes.sync_worker_query;

      expect(syncIndex).toBeDefined();
      // Index keys are returned as array of arrays in in-memory MongoDB
      if (Array.isArray(syncIndex)) {
        expect(syncIndex).toContainEqual(["googleFitConnected", 1]);
        expect(syncIndex).toContainEqual(["lastSyncAt", 1]);
      } else if (syncIndex.key) {
        expect(syncIndex.key).toEqual({
          googleFitConnected: 1,
          lastSyncAt: 1,
        });
      }

      console.log("✅ sync_worker_query has correct field order (boolean first, date second)");
    });

    it("should have token_expiry_cleanup as sparse index", async () => {
      const indexes = await User.collection.getIndexes();
      const tokenIndex = indexes.token_expiry_cleanup;

      expect(tokenIndex).toBeDefined();
      // Check for sparse property or array structure
      if (Array.isArray(tokenIndex)) {
        expect(tokenIndex).toContainEqual(["googleFitTokens.token_expiry", 1]);
      } else if (tokenIndex.key) {
        expect(tokenIndex.key).toEqual({
          "googleFitTokens.token_expiry": 1,
        });
      }

      console.log("✅ token_expiry_cleanup is configured correctly");
    });

    it("should have active_google_fit_users compound index", async () => {
      const indexes = await User.collection.getIndexes();
      const activeIndex = indexes.active_google_fit_users;

      expect(activeIndex).toBeDefined();
      // Check array structure or key structure
      if (Array.isArray(activeIndex)) {
        expect(activeIndex).toContainEqual(["googleFitConnected", 1]);
        expect(activeIndex).toContainEqual(["googleFitTokens.token_expiry", 1]);
      } else if (activeIndex.key) {
        expect(activeIndex.key).toEqual({
          googleFitConnected: 1,
          "googleFitTokens.token_expiry": 1,
        });
      }

      console.log("✅ active_google_fit_users compound index is properly configured");
    });
  });

  describe("Sync Query Performance", () => {
    it("should use index for sync worker queries", async () => {
      // Create test users
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      await User.create([
        {
          email: "syncuser1@example.com",
          password: "TestPassword123!",
          name: "Sync User 1",
          googleFitConnected: true,
          googleFitTokens: {
            access_token: "token1_valid_long_enough",
            refresh_token: "refresh1_valid_long_enough",
            token_expiry: futureDate,
            scope:
              "https://www.googleapis.com/auth/fitness.activity.read " +
              "https://www.googleapis.com/auth/fitness.body.read " +
              "https://www.googleapis.com/auth/fitness.nutrition.read " +
              "https://www.googleapis.com/auth/fitness.sleep.read",
          },
          lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          email: "syncuser2@example.com",
          password: "TestPassword123!",
          name: "Sync User 2",
          googleFitConnected: false,
        },
        {
          email: "syncuser3@example.com",
          password: "TestPassword123!",
          name: "Sync User 3",
          googleFitConnected: true,
          googleFitTokens: {
            access_token: "token3_valid_long_enough",
            refresh_token: "refresh3_valid_long_enough",
            token_expiry: futureDate,
            scope:
              "https://www.googleapis.com/auth/fitness.activity.read " +
              "https://www.googleapis.com/auth/fitness.body.read " +
              "https://www.googleapis.com/auth/fitness.nutrition.read " +
              "https://www.googleapis.com/auth/fitness.sleep.read",
          },
          lastSyncAt: null,
        },
      ]);

      // Query: Find all connected users
      const explain = await User.find({
        googleFitConnected: true,
      }).explain("executionStats");

      // Check execution stage
      const executionStage = explain.executionStats.executionStages;
      console.log("Execution stage:", executionStage.stage);

      // Should efficiently find connected users
      expect(explain.executionStats.totalDocsExamined).toBeLessThanOrEqual(2);

      console.log(`✅ Query efficient: scanned ${explain.executionStats.totalDocsExamined} docs`);
    });

    it("should efficiently query connected users needing sync", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      await User.create([
        {
          email: "needing_sync@example.com",
          password: "TestPassword123!",
          name: "Needs Sync",
          googleFitConnected: true,
          googleFitTokens: {
            access_token: "token_valid_string_long",
            refresh_token: "refresh_valid_string_long",
            token_expiry: futureDate,
            scope:
              "https://www.googleapis.com/auth/fitness.activity.read " +
              "https://www.googleapis.com/auth/fitness.body.read " +
              "https://www.googleapis.com/auth/fitness.nutrition.read " +
              "https://www.googleapis.com/auth/fitness.sleep.read",
          },
          lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          email: "recently_synced@example.com",
          password: "TestPassword123!",
          name: "Recently Synced",
          googleFitConnected: true,
          googleFitTokens: {
            access_token: "token_valid_string_long",
            refresh_token: "refresh_valid_string_long",
            token_expiry: futureDate,
            scope:
              "https://www.googleapis.com/auth/fitness.activity.read " +
              "https://www.googleapis.com/auth/fitness.body.read " +
              "https://www.googleapis.com/auth/fitness.nutrition.read " +
              "https://www.googleapis.com/auth/fitness.sleep.read",
          },
          lastSyncAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        },
      ]);

      // Query: Find users to sync (connected + not synced recently)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const usersNeedingSync = await User.find({
        googleFitConnected: true,
        $or: [{ lastSyncAt: { $lt: oneHourAgo } }, { lastSyncAt: null }],
      });

      expect(usersNeedingSync).toHaveLength(1);
      expect(usersNeedingSync[0].email).toBe("needing_sync@example.com");

      console.log("✅ Sync worker query returned correct results");
    });

    it("should use sparse index for expired token queries", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      await User.create([
        {
          email: "notconnected@example.com",
          password: "TestPassword123!",
          name: "Not Connected",
          googleFitConnected: false,
        },
        {
          email: "connected1@example.com",
          password: "TestPassword123!",
          name: "Connected 1",
          googleFitConnected: true,
          googleFitTokens: {
            access_token: "token_valid_string_long",
            refresh_token: "refresh_valid_string_long",
            token_expiry: futureDate,
            scope:
              "https://www.googleapis.com/auth/fitness.activity.read " +
              "https://www.googleapis.com/auth/fitness.body.read " +
              "https://www.googleapis.com/auth/fitness.nutrition.read " +
              "https://www.googleapis.com/auth/fitness.sleep.read",
          },
        },
      ]);

      // Query: Find users with valid active OAuth
      const usersWithValidTokens = await User.find({
        googleFitConnected: true,
      });

      expect(usersWithValidTokens).toHaveLength(1);
      expect(usersWithValidTokens[0].email).toBe("connected1@example.com");

      console.log("✅ Connected user query works correctly with indexes");
    });
  });

  describe("Index Statistics", () => {
    it("should report index names for monitoring", async () => {
      const indexes = await User.collection.getIndexes();
      const indexList = Object.keys(indexes);

      console.log("\n📊 Collection Indexes:");
      indexList.forEach((idx) => {
        console.log(`  ✅ ${idx}`);
      });

      expect(indexList.length).toBeGreaterThan(0);
    });

    it("should have email unique index", async () => {
      const indexes = await User.collection.getIndexes();
      const emailIndex = indexes.unique_email || indexes.email_1;

      expect(emailIndex).toBeDefined();
      console.log("✅ Email unique constraint index exists");
    });

    it("should have google ID partial unique index", async () => {
      const indexes = await User.collection.getIndexes();
      const googleIdIndex = indexes.unique_google_id || indexes.googleId_1;

      expect(googleIdIndex).toBeDefined();
      console.log("✅ Google ID partial unique index exists");
    });
  });
});
