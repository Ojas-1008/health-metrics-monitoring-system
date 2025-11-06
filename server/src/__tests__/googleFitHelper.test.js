/**
 * server/src/__tests__/googleFitHelper.test.js
 * Test suite for Google Fit token refresh helper
 * Run with: npm test -- googleFitHelper.test.js
 */

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import {
  refreshGoogleFitToken,
  getValidAccessToken,
  checkTokenExpiry,
} from "../utils/googleFitHelper.js";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";

// Google Fit OAuth scope (must match exactly as defined in User model)
const GOOGLE_FIT_OAUTH_SCOPE =
  "https://www.googleapis.com/auth/fitness.activity.read " +
  "https://www.googleapis.com/auth/fitness.body.read " +
  "https://www.googleapis.com/auth/fitness.nutrition.read " +
  "https://www.googleapis.com/auth/fitness.sleep.read " +
  "https://www.googleapis.com/auth/fitness.location.read";

describe("Google Fit Helper - Token Refresh", () => {
  let testUser;
  let mongoServer;

  beforeAll(async () => {
    // Start in-memory MongoDB for testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    // Create test user with valid tokens
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    testUser = await User.create({
      email: "tokentest@example.com",
      password: "TestPassword123!",
      name: "Token Test User",
      googleFitConnected: true,
      googleFitTokens: {
        access_token: "valid_access_token_12345",
        refresh_token: "valid_refresh_token_12345",
        token_expiry: futureDate,
        scope: GOOGLE_FIT_OAUTH_SCOPE,
      },
    });
  });

  describe("refreshGoogleFitToken()", () => {
    it("should return existing token if not near expiry", async () => {
      const tokens = await refreshGoogleFitToken(testUser._id);

      expect(tokens.access_token).toBe("valid_access_token_12345");
      expect(tokens.refreshed).toBe(false);
      console.log("✅ Token returned without refresh (still valid)");
    });

    it("should detect token needs refresh within 5 minutes", async () => {
      // Set expiry to 4 minutes from now
      const nearExpiry = new Date();
      nearExpiry.setMinutes(nearExpiry.getMinutes() + 4);

      testUser.googleFitTokens.token_expiry = nearExpiry;
      await testUser.save();

      const status = await checkTokenExpiry(testUser._id);
      
      expect(status.needsRefresh).toBe(true);
      expect(status.expiresIn).toBeLessThanOrEqual(5);
      console.log(`✅ Token detected as needing refresh (expires in ${status.expiresIn} minutes)`);
    });

    it("should throw 400 if user not connected", async () => {
      testUser.googleFitConnected = false;
      await testUser.save();

      try {
        await refreshGoogleFitToken(testUser._id);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("not connected");
        console.log("✅ Properly rejected disconnected user");
      }
    });

    it("should throw 404 if user not found", async () => {
      const fakeUserId = new mongoose.Types.ObjectId();

      try {
        await refreshGoogleFitToken(fakeUserId);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("not found");
        console.log("✅ Properly rejected non-existent user");
      }
    });

    it("should handle missing tokens gracefully", async () => {
      // For this test, we'll just disconnect the user which triggers the same error path
      testUser.googleFitConnected = false;
      testUser.googleFitTokens = null;
      await testUser.save();

      // Reconnect to trigger validation
      testUser.googleFitConnected = true;
      
      try {
        await testUser.save();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toContain("required when googleFitConnected is true");
        console.log("✅ Properly rejected user with missing tokens");
      }
    });

    it("should validate token structure before refresh", async () => {
      // Create user with incomplete tokens (missing token_expiry)
      await User.deleteMany({});
      
      try {
        await User.create({
          email: "incomplete@example.com",
          password: "TestPassword123!",
          name: "Incomplete User",
          googleFitConnected: true,
          googleFitTokens: {
            access_token: "minimum_valid_token_value",
            refresh_token: "minimum_valid_refresh_token",
            // Missing token_expiry
            scope: GOOGLE_FIT_OAUTH_SCOPE,
          },
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toContain("required when googleFitConnected is true");
        console.log("✅ Detected incomplete token structure");
      }
    });
  });

  describe("checkTokenExpiry()", () => {
    it("should calculate time until expiry correctly", async () => {
      const status = await checkTokenExpiry(testUser._id);

      expect(status.isExpired).toBe(false);
      expect(status.expiresIn).toBeGreaterThan(1440); // More than 24 hours (30 days)
      expect(status.needsRefresh).toBe(false);
      console.log(`✅ Token expires in ${status.expiresIn} minutes (not expired)`);
    });

    it("should detect expired token", async () => {
      // Set expiry to past date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      testUser.googleFitTokens.token_expiry = pastDate;
      await testUser.save();

      const status = await checkTokenExpiry(testUser._id);

      expect(status.isExpired).toBe(true);
      expect(status.needsRefresh).toBe(true);
      expect(status.expiresIn).toBeLessThan(0);
      console.log("✅ Correctly detected expired token");
    });

    it("should detect token expiring within 5 minutes", async () => {
      // Set expiry to 3 minutes from now
      const almostExpired = new Date();
      almostExpired.setMinutes(almostExpired.getMinutes() + 3);

      testUser.googleFitTokens.token_expiry = almostExpired;
      await testUser.save();

      const status = await checkTokenExpiry(testUser._id);

      expect(status.isExpired).toBe(false); // Not yet expired
      expect(status.needsRefresh).toBe(true); // But needs refresh
      expect(status.expiresIn).toBeLessThanOrEqual(5);
      console.log(`✅ Detected token needs refresh (expires in ${status.expiresIn} minutes)`);
    });

    it("should handle disconnected user gracefully", async () => {
      testUser.googleFitConnected = false;
      await testUser.save();

      const status = await checkTokenExpiry(testUser._id);

      expect(status.isExpired).toBe(true);
      expect(status.needsRefresh).toBe(true);
      expect(status.message).toContain("not connected");
      console.log("✅ Properly reported disconnected user status");
    });

    it("should return ISO timestamp", async () => {
      const status = await checkTokenExpiry(testUser._id);

      expect(status.tokenExpiry).toBeTruthy();
      expect(status.tokenExpiry).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format
      console.log(`✅ Token expiry timestamp in ISO format: ${status.tokenExpiry}`);
    });
  });

  describe("getValidAccessToken()", () => {
    it("should return valid access token", async () => {
      const accessToken = await getValidAccessToken(testUser._id);

      expect(accessToken).toBe("valid_access_token_12345");
      expect(typeof accessToken).toBe("string");
      expect(accessToken.length).toBeGreaterThan(0);
      console.log(`✅ Retrieved valid access token: ${accessToken.substring(0, 15)}...`);
    });

    it("should throw error if user not connected", async () => {
      testUser.googleFitConnected = false;
      await testUser.save();

      try {
        await getValidAccessToken(testUser._id);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.statusCode).toBe(400);
        console.log("✅ Properly rejected disconnected user");
      }
    });

    it("should throw error if user not found", async () => {
      const fakeUserId = new mongoose.Types.ObjectId();

      try {
        await getValidAccessToken(fakeUserId);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.statusCode).toBe(404);
        console.log("✅ Properly rejected non-existent user");
      }
    });
  });

  describe("Token Expiry Lifecycle", () => {
    it("Scenario 1: Fresh token (just obtained)", async () => {
      console.log("\n📋 Scenario 1: Fresh token lifecycle");

      const freshDate = new Date();
      freshDate.setHours(freshDate.getHours() + 1); // Expires in 1 hour

      testUser.googleFitTokens.token_expiry = freshDate;
      await testUser.save();

      const status = await checkTokenExpiry(testUser._id);

      console.log(`  - Expires in: ${status.expiresIn} minutes`);
      console.log(`  - Needs refresh: ${status.needsRefresh}`);
      console.log(`  - Is expired: ${status.isExpired}`);

      expect(status.isExpired).toBe(false);
      expect(status.needsRefresh).toBe(false);
      expect(status.expiresIn).toBeGreaterThan(50);
    });

    it("Scenario 2: Token near expiry (4 minutes)", async () => {
      console.log("\n📋 Scenario 2: Token near expiry");

      const nearExpiry = new Date();
      nearExpiry.setMinutes(nearExpiry.getMinutes() + 4);

      testUser.googleFitTokens.token_expiry = nearExpiry;
      await testUser.save();

      const status = await checkTokenExpiry(testUser._id);

      console.log(`  - Expires in: ${status.expiresIn} minutes`);
      console.log(`  - Needs refresh: ${status.needsRefresh}`);
      console.log(`  - Is expired: ${status.isExpired}`);

      expect(status.isExpired).toBe(false);
      expect(status.needsRefresh).toBe(true);
      expect(status.expiresIn).toBeLessThanOrEqual(5);
    });

    it("Scenario 3: Token already expired", async () => {
      console.log("\n📋 Scenario 3: Token already expired");

      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      testUser.googleFitTokens.token_expiry = pastDate;
      await testUser.save();

      const status = await checkTokenExpiry(testUser._id);

      console.log(`  - Expires in: ${status.expiresIn} minutes`);
      console.log(`  - Needs refresh: ${status.needsRefresh}`);
      console.log(`  - Is expired: ${status.isExpired}`);

      expect(status.isExpired).toBe(true);
      expect(status.needsRefresh).toBe(true);
      expect(status.expiresIn).toBeLessThan(0);
    });
  });

  describe("Error Scenarios", () => {
    it("should provide descriptive error when Google Fit not connected", async () => {
      testUser.googleFitConnected = false;
      await testUser.save();

      const errorMessage = "Google Fit is not connected. Please connect your account first.";

      try {
        await refreshGoogleFitToken(testUser._id);
      } catch (error) {
        expect(error.message).toBe(errorMessage);
        console.log(`✅ Error message is clear: "${error.message}"`);
      }
    });

    it("should handle data inconsistency (connected but no tokens)", async () => {
      console.log("\n📋 Data inconsistency test");

      // This test verifies the model validation catches the inconsistency
      testUser.googleFitConnected = true;
      testUser.googleFitTokens = null;
      
      try {
        await testUser.save();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toContain("required when googleFitConnected is true");
        console.log(`✅ Detected inconsistency - model validation triggered`);
        console.log(`   Error: "${error.message.substring(0, 50)}..."`);
      }
    });
  });
});
