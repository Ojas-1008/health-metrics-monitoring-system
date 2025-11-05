/**
 * server/tests/User.test.js
 * Comprehensive testing for Google Fit OAuth integration
 * Run with: npm test -- User.test.js
 */

import mongoose from "mongoose";
import User from "../models/User.js";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";

describe("User Model - Google Fit OAuth Integration", () => {
  let testUserId;

  beforeAll(async () => {
    // Connect to test MongoDB
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/health_metrics_test");
    }
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  // ===== SECURITY TESTS =====

  describe("Security: googleFitTokens.select = false", () => {
    it("should NOT return tokens in query WITHOUT .select('+googleFitTokens')", async () => {
      // Create test user with tokens
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now

      const user = await User.create({
        email: "securitytest@example.com",
        password: "TestPassword123!",
        name: "Security Test User",
        googleFitConnected: true,
        googleFitTokens: {
          access_token: "test_access_token_1234567890",
          refresh_token: "test_refresh_token_1234567890",
          token_expiry: expiryDate,
          scope:
            "https://www.googleapis.com/auth/fitness.activity.read " +
            "https://www.googleapis.com/auth/fitness.body.read " +
            "https://www.googleapis.com/auth/fitness.nutrition.read " +
            "https://www.googleapis.com/auth/fitness.sleep.read",
        },
      });

      // Query WITHOUT .select('+googleFitTokens')
      const queriedUser = await User.findById(user._id);

      // Tokens should NOT be present
      expect(queriedUser.googleFitTokens).toBeUndefined();
      expect(queriedUser.googleFitConnected).toBe(true); // But status should be visible
    });

    it("should return tokens in query WITH .select('+googleFitTokens')", async () => {
      // Create test user with tokens
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const user = await User.create({
        email: "securitytest2@example.com",
        password: "TestPassword123!",
        name: "Security Test User 2",
        googleFitConnected: true,
        googleFitTokens: {
          access_token: "test_access_token_1234567890",
          refresh_token: "test_refresh_token_1234567890",
          token_expiry: expiryDate,
          scope:
            "https://www.googleapis.com/auth/fitness.activity.read " +
            "https://www.googleapis.com/auth/fitness.body.read " +
            "https://www.googleapis.com/auth/fitness.nutrition.read " +
            "https://www.googleapis.com/auth/fitness.sleep.read",
        },
      });

      // Query WITH .select('+googleFitTokens')
      const queriedUser = await User.findById(user._id).select("+googleFitTokens");

      // Tokens SHOULD be present
      expect(queriedUser.googleFitTokens).toBeDefined();
      expect(queriedUser.googleFitTokens.access_token).toBe("test_access_token_1234567890");
      expect(queriedUser.googleFitTokens.refresh_token).toBe("test_refresh_token_1234567890");
    });

    it("should NOT return tokens in list queries", async () => {
      // Create multiple test users with tokens
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      await User.create([
        {
          email: "user1@example.com",
          password: "TestPassword123!",
          name: "User 1",
          googleFitConnected: true,
          googleFitTokens: {
            access_token: "token1",
            refresh_token: "refresh1",
            token_expiry: expiryDate,
            scope:
              "https://www.googleapis.com/auth/fitness.activity.read " +
              "https://www.googleapis.com/auth/fitness.body.read " +
              "https://www.googleapis.com/auth/fitness.nutrition.read " +
              "https://www.googleapis.com/auth/fitness.sleep.read",
          },
        },
        {
          email: "user2@example.com",
          password: "TestPassword123!",
          name: "User 2",
          googleFitConnected: true,
          googleFitTokens: {
            access_token: "token2",
            refresh_token: "refresh2",
            token_expiry: expiryDate,
            scope:
              "https://www.googleapis.com/auth/fitness.activity.read " +
              "https://www.googleapis.com/auth/fitness.body.read " +
              "https://www.googleapis.com/auth/fitness.nutrition.read " +
              "https://www.googleapis.com/auth/fitness.sleep.read",
          },
        },
      ]);

      // Query all users WITHOUT explicit token selection
      const users = await User.find({ googleFitConnected: true });

      users.forEach((user) => {
        expect(user.googleFitTokens).toBeUndefined();
      });
    });
  });

  // ===== VALIDATION TESTS =====

  describe("Validation: Token Fields", () => {
    it("should reject access_token shorter than 10 characters", async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const user = new User({
        email: "validation@example.com",
        password: "TestPassword123!",
        name: "Validation User",
        googleFitConnected: true,
        googleFitTokens: {
          access_token: "short",
          refresh_token: "test_refresh_token_1234567890",
          token_expiry: expiryDate,
          scope:
            "https://www.googleapis.com/auth/fitness.activity.read " +
            "https://www.googleapis.com/auth/fitness.body.read " +
            "https://www.googleapis.com/auth/fitness.nutrition.read " +
            "https://www.googleapis.com/auth/fitness.sleep.read",
        },
      });

      await expect(user.save()).rejects.toThrow(
        /Access token must be at least 10 characters/
      );
    });

    it("should reject token_expiry that is not a future date", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const user = new User({
        email: "pastdate@example.com",
        password: "TestPassword123!",
        name: "Past Date User",
        googleFitConnected: true,
        googleFitTokens: {
          access_token: "test_access_token_1234567890",
          refresh_token: "test_refresh_token_1234567890",
          token_expiry: pastDate,
          scope:
            "https://www.googleapis.com/auth/fitness.activity.read " +
            "https://www.googleapis.com/auth/fitness.body.read " +
            "https://www.googleapis.com/auth/fitness.nutrition.read " +
            "https://www.googleapis.com/auth/fitness.sleep.read",
        },
      });

      await expect(user.save()).rejects.toThrow(/Token expiry must be a future date/);
    });

    it("should reject scope that doesn't match exact OAuth scope string", async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const user = new User({
        email: "wrongscope@example.com",
        password: "TestPassword123!",
        name: "Wrong Scope User",
        googleFitConnected: true,
        googleFitTokens: {
          access_token: "test_access_token_1234567890",
          refresh_token: "test_refresh_token_1234567890",
          token_expiry: expiryDate,
          scope: "https://www.googleapis.com/auth/fitness.activity.read", // Wrong scope
        },
      });

      await expect(user.save()).rejects.toThrow(
        /Scope must match the exact OAuth scope/
      );
    });
  });

  // ===== VIRTUAL PROPERTY TESTS =====

  describe("Virtual Properties: isGoogleFitActive", () => {
    it("should return true when all conditions are met", async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const user = await User.create({
        email: "active@example.com",
        password: "TestPassword123!",
        name: "Active User",
        googleFitConnected: true,
        googleFitTokens: {
          access_token: "test_access_token_1234567890",
          refresh_token: "test_refresh_token_1234567890",
          token_expiry: expiryDate,
          scope:
            "https://www.googleapis.com/auth/fitness.activity.read " +
            "https://www.googleapis.com/auth/fitness.body.read " +
            "https://www.googleapis.com/auth/fitness.nutrition.read " +
            "https://www.googleapis.com/auth/fitness.sleep.read",
        },
      });

      const queriedUser = await User.findById(user._id).select("+googleFitTokens");

      expect(queriedUser.isGoogleFitActive).toBe(true);
    });

    it("should return false when googleFitConnected is false", async () => {
      const user = await User.create({
        email: "notactive@example.com",
        password: "TestPassword123!",
        name: "Not Active User",
        googleFitConnected: false,
      });

      const queriedUser = await User.findById(user._id);

      expect(queriedUser.isGoogleFitActive).toBe(false);
    });

    it("should return false when token is expired", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const user = await User.create({
        email: "expired@example.com",
        password: "TestPassword123!",
        name: "Expired User",
        googleFitConnected: true,
        googleFitTokens: {
          access_token: "test_access_token_1234567890",
          refresh_token: "test_refresh_token_1234567890",
          token_expiry: pastDate,
          scope:
            "https://www.googleapis.com/auth/fitness.activity.read " +
            "https://www.googleapis.com/auth/fitness.body.read " +
            "https://www.googleapis.com/auth/fitness.nutrition.read " +
            "https://www.googleapis.com/auth/fitness.sleep.read",
        },
      });

      const queriedUser = await User.findById(user._id).select("+googleFitTokens");

      expect(queriedUser.isGoogleFitActive).toBe(false);
    });
  });

  // ===== INSTANCE METHOD TESTS =====

  describe("Instance Methods: updateGoogleFitTokens", () => {
    it("should successfully update tokens with valid data", async () => {
      const user = await User.create({
        email: "methodtest@example.com",
        password: "TestPassword123!",
        name: "Method Test User",
      });

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      user.updateGoogleFitTokens({
        access_token: "test_access_token_1234567890",
        refresh_token: "test_refresh_token_1234567890",
        token_expiry: expiryDate,
        scope:
          "https://www.googleapis.com/auth/fitness.activity.read " +
          "https://www.googleapis.com/auth/fitness.body.read " +
          "https://www.googleapis.com/auth/fitness.nutrition.read " +
          "https://www.googleapis.com/auth/fitness.sleep.read",
      });

      await user.save();

      const savedUser = await User.findById(user._id).select("+googleFitTokens");

      expect(savedUser.googleFitConnected).toBe(true);
      expect(savedUser.googleFitTokens.access_token).toBe(
        "test_access_token_1234567890"
      );
      expect(savedUser.lastSyncAt).toBeDefined();
    });

    it("should throw error when tokens are incomplete", async () => {
      const user = await User.create({
        email: "incomplete@example.com",
        password: "TestPassword123!",
        name: "Incomplete User",
      });

      expect(() => {
        user.updateGoogleFitTokens({
          access_token: "test_access_token_1234567890",
          // Missing refresh_token, token_expiry, scope
        });
      }).toThrow(/All token fields.*are required/);
    });
  });

  describe("Instance Methods: disconnectGoogleFit", () => {
    it("should clear Google Fit tokens and mark as disconnected", async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const user = await User.create({
        email: "disconnect@example.com",
        password: "TestPassword123!",
        name: "Disconnect User",
        googleFitConnected: true,
        googleFitTokens: {
          access_token: "test_access_token_1234567890",
          refresh_token: "test_refresh_token_1234567890",
          token_expiry: expiryDate,
          scope:
            "https://www.googleapis.com/auth/fitness.activity.read " +
            "https://www.googleapis.com/auth/fitness.body.read " +
            "https://www.googleapis.com/auth/fitness.nutrition.read " +
            "https://www.googleapis.com/auth/fitness.sleep.read",
        },
      });

      user.disconnectGoogleFit();
      await user.save();

      const savedUser = await User.findById(user._id).select("+googleFitTokens");

      expect(savedUser.googleFitConnected).toBe(false);
      expect(savedUser.googleFitTokens.access_token).toBeUndefined();
      expect(savedUser.isGoogleFitActive).toBe(false);
    });
  });

  // ===== DATA CONSISTENCY TESTS =====

  describe("Data Consistency: Sync Preferences", () => {
    it("should have correct default sync preferences", async () => {
      const user = await User.create({
        email: "syncprefs@example.com",
        password: "TestPassword123!",
        name: "Sync Prefs User",
      });

      expect(user.syncPreferences.frequency).toBe("daily");
      expect(user.syncPreferences.enabledDataTypes.steps).toBe(true);
      expect(user.syncPreferences.enabledDataTypes.weight).toBe(true);
      expect(user.syncPreferences.enabledDataTypes.sleep).toBe(true);
      expect(user.syncPreferences.enabledDataTypes.calories).toBe(true);
      expect(user.syncPreferences.enabledDataTypes.distance).toBe(true);
      expect(user.syncPreferences.enabledDataTypes.heartRate).toBe(false); // Mobile-only, no HR
    });

    it("should allow customization of sync preferences", async () => {
      const user = await User.create({
        email: "customsync@example.com",
        password: "TestPassword123!",
        name: "Custom Sync User",
        syncPreferences: {
          frequency: "hourly",
          enabledDataTypes: {
            steps: true,
            weight: false,
            heartRate: false,
            sleep: true,
            calories: false,
            distance: true,
          },
        },
      });

      expect(user.syncPreferences.frequency).toBe("hourly");
      expect(user.syncPreferences.enabledDataTypes.weight).toBe(false);
      expect(user.syncPreferences.enabledDataTypes.calories).toBe(false);
    });
  });
});
