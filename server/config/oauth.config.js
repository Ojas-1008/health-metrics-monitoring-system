/**
* server/config/oauth.config.js
* 
* Google OAuth configuration management
* Validates environment variables and provides defaults
* Ensures security and consistency across the application
*/
import dotenv from "dotenv";
// Load environment variables
dotenv.config();

/**
* Google Fit OAuth scope constant
* MUST match the GOOGLE_FIT_OAUTH_SCOPES environment variable
* This is the authoritative scope definition used in token validation
*/
const GOOGLE_FIT_OAUTH_SCOPE = 
"https://www.googleapis.com/auth/fitness.activity.read " +
"https://www.googleapis.com/auth/fitness.body.read " +
"https://www.googleapis.com/auth/fitness.nutrition.read " +
"https://www.googleapis.com/auth/fitness.sleep.read " +
"https://www.googleapis.com/auth/fitness.location.read";

/**
* Validate required OAuth environment variables
* Throws error if critical configs are missing in production
*/
function validateOAuthConfig() {
  const requiredInProduction = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
  ];

  if (process.env.NODE_ENV === "production") {
    requiredInProduction.forEach((key) => {
      if (!process.env[key]) {
        throw new Error(
          `Missing required OAuth environment variable: ${key}\n` +
          `Set it in your .env file or deployment secrets`
        );
      }
    });
  }
}

/**
* Parse OAuth scopes from environment
* Falls back to default if not set
*/
function parseOAuthScopes() {
  const envScopes = process.env.GOOGLE_FIT_OAUTH_SCOPES;

  if (!envScopes) {
    console.warn(
      "⚠️  GOOGLE_FIT_OAUTH_SCOPES not set in .env, using defaults"
    );
    return GOOGLE_FIT_OAUTH_SCOPE;
  }

  // Validate that env scopes match expected constant
  const envScopesTrimmed = envScopes.trim();
  if (envScopesTrimmed !== GOOGLE_FIT_OAUTH_SCOPE) {
    console.warn(
      "⚠️  WARNING: GOOGLE_FIT_OAUTH_SCOPES in .env doesn't match GOOGLE_FIT_OAUTH_SCOPE constant\n" +
      "This will cause token validation failures.\n" +
      "Update server/config/oauth.config.js GOOGLE_FIT_OAUTH_SCOPE to match .env or vice versa"
    );
  }

  return envScopesTrimmed;
}

// Validate on load
validateOAuthConfig();

/**
* OAuth Configuration Object
* Exported for use throughout the application
*/
const oauthConfig = {
  // Google OAuth credentials
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/googlefit/callback",
  },

  // Google Fit API configuration
  googleFit: {
    // OAuth scopes for Google Fit API
    scopes: parseOAuthScopes(),

    // Base URL for Google Fit API calls
    apiBaseUrl: process.env.GOOGLE_FIT_API_BASE_URL || 
      "https://www.googleapis.com/fitness/v1/users/me",

    // API call timeout (milliseconds)
    apiTimeout: parseInt(process.env.GOOGLE_FIT_API_TIMEOUT || "30000"),

    // Supported data sources (Android phone only - no wearables)
    supportedDataSources: {
      "com.google.android.gms:step_count": {
        name: "Steps",
        enabled: true,
        description: "Daily step count from phone accelerometer",
        wearableOnly: false,
      },
      "com.google.android.gms:distance_delta": {
        name: "Distance",
        enabled: true,
        description: "Distance traveled from phone GPS",
        wearableOnly: false,
      },
      "com.google.android.gms:calories.expended": {
        name: "Calories Burned",
        enabled: true,
        description: "Estimated calories burned from activity",
        wearableOnly: false,
      },
      "com.google.android.gms:body.weight": {
        name: "Weight",
        enabled: true,
        description: "Weight measurements manually logged or from smart scale",
        wearableOnly: false,
      },
      "com.google.android.gms:sleep.segment": {
        name: "Sleep",
        enabled: true,
        description: "Sleep duration and quality",
        wearableOnly: false,
      },
      // INTENTIONALLY DISABLED - wearable-only data sources
      // "com.google.android.gms:heart_rate": { enabled: false, wearableOnly: true },
      // "com.google.android.gms:oxygen_saturation": { enabled: false, wearableOnly: true },
      // "com.google.android.gms:blood_pressure": { enabled: false, wearableOnly: true },
    },

    // Retry configuration
    maxRetries: parseInt(process.env.SYNC_MAX_RETRIES || "3"),
    retryDelay: parseInt(process.env.SYNC_RETRY_DELAY || "5000"),
  },

  // Sync worker configuration
  syncWorker: {
    // CRON expression for sync schedule
    cronSchedule: process.env.SYNC_CRON_SCHEDULE || "*/15 * * * *",

    // Maximum users to process per cron run
    batchSize: parseInt(process.env.SYNC_BATCH_SIZE || "50"),

    // Enable/disable sync worker
    enabled: process.env.SYNC_WORKER_ENABLED !== "false",

    // Description for logging
    description: `Syncing up to ${process.env.SYNC_BATCH_SIZE || 50} users every ${process.env.SYNC_CRON_SCHEDULE || "15 minutes"}`,
  },

  // Feature flags
  features: {
    googleFitEnabled: process.env.FEATURE_GOOGLE_FIT_ENABLED !== "false",
    realtimeUpdatesEnabled: process.env.FEATURE_REALTIME_UPDATES_ENABLED !== "false",
    predictiveAnalyticsEnabled: process.env.FEATURE_PREDICTIVE_ANALYTICS_ENABLED === "true",
  },
};

export default oauthConfig;