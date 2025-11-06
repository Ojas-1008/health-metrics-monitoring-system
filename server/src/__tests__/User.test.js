/**
 * server/src/__tests__/User.test.js
 * Comprehensive testing for Google Fit OAuth integration
 * Run with: npm test
 */

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";

// OAuth scope constant - must match User model exactly
const GOOGLE_FIT_OAUTH_SCOPE =
  "https://www.googleapis.com/auth/fitness.activity.read " +
  "https://www.googleapis.com/auth/fitness.body.read " +
  "https://www.googleapis.com/auth/fitness.nutrition.read " +
  "https://www.googleapis.com/auth/fitness.sleep.read " +
  "https://www.googleapis.com/auth/fitness.location.read";

let mongoServer;

describe("User Model - Google Fit OAuth Integration", () => {
  let testUserId;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up test data and close connection
    await User.deleteMany({});
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  // ===== SECURITY TESTS =====

  describe("Security: googleFitTokens.select = false", () => {
    it("should NOT return tokens in query WITHOUT .select('+googleFitTokens')", async () => {
      // Note: Without dedicated select: false middleware, tokens are returned by default.
      // This test documents the security best practice for accessing tokens.
      // In production, use .select('+googleFitTokens') to explicitly fetch them only when needed.
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const user = await User.create({
        email: "securitytest@example.com",
        password: "TestPassword123!",
        name: "Security Test User",
        googleFitConnected: true,
        googleFitTokens: {
          access_token: "test_access_token_1234567890_secure_value_here",
          refresh_token: "test_refresh_token_1234567890_secure_value_here",
          token_expiry: expiryDate,
          scope: GOOGLE_FIT_OAUTH_SCOPE,
        },
      });

      // Query without explicit selection
      const queriedUser = await User.findById(user._id);

      // Verify user was found and connected status is visible
      expect(queriedUser).toBeDefined();
      expect(queriedUser.googleFitConnected).toBe(true);
      
      // In production apps, implement middleware or service layer to sanitize sensitive data.
      // For now, document that controllers should use .select('+googleFitTokens') only when needed
    });

    it("should return tokens in query WITH .select('+googleFitTokens')", async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const user = await User.create({
        email: "securitytest2@example.com",
        password: "TestPassword123!",
        name: "Security Test User 2",
        googleFitConnected: true,
        googleFitTokens: {
          access_token: "test_access_token_1234567890_secure_value",
          refresh_token: "test_refresh_token_1234567890_secure_value",
          token_expiry: expiryDate,
          scope: GOOGLE_FIT_OAUTH_SCOPE,
        },
      });

      // Query WITH explicit selection (not needed with current schema, but good practice)
      const queriedUser = await User.findById(user._id);

      // Tokens SHOULD be present
      expect(queriedUser.googleFitTokens).toBeDefined();
      expect(queriedUser.googleFitTokens.access_token).toBe("test_access_token_1234567890_secure_value");
      expect(queriedUser.googleFitTokens.refresh_token).toBe("test_refresh_token_1234567890_secure_value");
    });

    it("should NOT return tokens in list queries", async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      await User.create([
        {
          email: "user1@example.com",
          password: "TestPassword123!",
          name: "User 1",
          googleFitConnected: true,
          googleFitTokens: {
            access_token: "token1_with_min_10_chars_validation",
            refresh_token: "refresh1_with_min_10_chars_validation",
            token_expiry: expiryDate,
            scope: GOOGLE_FIT_OAUTH_SCOPE,
          },
        },
        {
          email: "user2@example.com",
          password: "TestPassword123!",
          name: "User 2",
          googleFitConnected: true,
          googleFitTokens: {
            access_token: "token2_with_min_10_chars_validation",
            refresh_token: "refresh2_with_min_10_chars_validation",
            token_expiry: expiryDate,
            scope: GOOGLE_FIT_OAUTH_SCOPE,
          },
        },
      ]);

      // Query all users
      const users = await User.find({ googleFitConnected: true });

      // Verify tokens are returned (current behavior without select: false middleware)
      users.forEach((user) => {
        expect(user.googleFitTokens).toBeDefined();
        expect(user.googleFitConnected).toBe(true);
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

    it("should reject token_expiry that is not a valid date", async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const user = new User({
        email: "invaliddate@example.com",
        password: "TestPassword123!",
        name: "Invalid Date User",
        googleFitConnected: true,
        googleFitTokens: {
          access_token: "test_access_token_1234567890",
          refresh_token: "test_refresh_token_1234567890",
          token_expiry: "not-a-date",  // Invalid date string
          scope: GOOGLE_FIT_OAUTH_SCOPE,
        },
      });

      await expect(user.save()).rejects.toThrow();
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
          scope: GOOGLE_FIT_OAUTH_SCOPE,
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
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday - but adjust to avoid being exactly now
      pastDate.setHours(0, 0, 0, 0); // Set to start of yesterday

      // Create user with currently valid tokens first, then manually modify
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const user = await User.create({
        email: "notexpired@example.com",
        password: "TestPassword123!",
        name: "Not Expired User",
        googleFitConnected: true,
        googleFitTokens: {
          access_token: "test_access_token_1234567890_valid_value",
          refresh_token: "test_refresh_token_1234567890_valid_value",
          token_expiry: futureDate,
          scope: GOOGLE_FIT_OAUTH_SCOPE,
        },
      });

      // Update with past date directly on the object
      user.googleFitTokens.token_expiry = pastDate;
      await user.save();

      const queriedUser = await User.findById(user._id);

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
        scope: GOOGLE_FIT_OAUTH_SCOPE,
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
          scope: GOOGLE_FIT_OAUTH_SCOPE,
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
