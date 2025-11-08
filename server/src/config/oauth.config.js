/**
 * server/src/config/oauth.config.js
 *
 * OAuth configuration for Google Fit integration
 * Environment variables with defaults for development
 *
 * This file centralizes all OAuth-related configuration
 * Used by controllers, helpers, and workers
 */

import dotenv from 'dotenv';
dotenv.config();

/**
 * ============================================
 * GOOGLE OAUTH CREDENTIALS
 * ============================================
 */

// Google OAuth 2.0 credentials from Google Cloud Console
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// OAuth callback URL (must match Google Cloud Console settings)
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/googlefit/callback';

// Required OAuth scopes for Google Fit API
export const GOOGLE_FIT_OAUTH_SCOPE = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.nutrition.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.location.read',
].join(' ');

/**
 * ============================================
 * SYNC WORKER CONFIGURATION
 * ============================================
 */

// Background sync worker settings
export const SYNC_WORKER_CONFIG = {
  // Enable/disable the sync worker
  enabled: process.env.SYNC_WORKER_ENABLED === 'true' || false,

  // Cron schedule for sync runs (default: every 15 minutes)
  // Format: "*/15 * * * *" = every 15 minutes
  // Other examples:
  // "0 */1 * * *" = every hour
  // "0 9 * * *" = daily at 9 AM
  // "0 9 * * 1" = weekly on Mondays at 9 AM
  cronSchedule: process.env.SYNC_CRON_SCHEDULE || '*/15 * * * *',

  // Maximum users to sync per batch (prevents API rate limits)
  batchSize: parseInt(process.env.SYNC_BATCH_SIZE) || 50,

  // Timezone for cron scheduling
  timezone: process.env.SYNC_TIMEZONE || 'Asia/Kolkata',
};

/**
 * ============================================
 * GOOGLE FIT API CONFIGURATION
 * ============================================
 */

// Google Fit API settings
export const GOOGLE_FIT_CONFIG = {
  // Base URL for Google Fit REST API
  apiBaseUrl: 'https://www.googleapis.com/fitness/v1/users/me',

  // API request timeout in milliseconds
  apiTimeout: parseInt(process.env.GOOGLE_FIT_API_TIMEOUT) || 30000, // 30 seconds

  // Maximum sync window in days (to prevent excessive API calls)
  maxSyncWindowDays: parseInt(process.env.GOOGLE_FIT_MAX_SYNC_WINDOW_DAYS) || 30,
};

// OAuth state token settings for CSRF protection
export const OAUTH_STATE_CONFIG = {
  // State token expiry in minutes
  expiryMinutes: parseInt(process.env.OAUTH_STATE_EXPIRY_MINUTES) || 10,

  // State token length (256-bit = 64 characters)
  tokenLength: 64,
};

/**
 * ============================================
 * TOKEN MANAGEMENT
 * ============================================
 */

// Access token refresh settings
export const TOKEN_CONFIG = {
  // Refresh tokens this many minutes before expiry
  refreshBufferMinutes: parseInt(process.env.TOKEN_REFRESH_BUFFER_MINUTES) || 5,

  // Maximum retry attempts for token refresh
  maxRefreshRetries: parseInt(process.env.MAX_TOKEN_REFRESH_RETRIES) || 3,
};

/**
 * ============================================
 * VALIDATION RULES
 * ============================================
 */

// Scope validation rules
export const SCOPE_VALIDATION = {
  // Required scopes (all must be present)
  requiredScopes: [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
  ],

  // Forbidden scopes (wearable-only data we don't want)
  forbiddenScopes: [
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
    'https://www.googleapis.com/auth/fitness.blood_pressure.read',
  ],
};

/**
 * ============================================
 * LEGACY EXPORTS (for backward compatibility)
 * ============================================
 */

// Export individual values for existing code
export const {
  enabled: SYNC_WORKER_ENABLED,
  cronSchedule: SYNC_CRON_SCHEDULE,
  batchSize: SYNC_BATCH_SIZE,
} = SYNC_WORKER_CONFIG;

/**
 * ============================================
 * CONFIG VALIDATION
 * ============================================
 */

// Validate required environment variables
const validateConfig = () => {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      console.warn(`⚠️  Warning: ${envVar} not set in environment variables`);
      console.warn(`   Google Fit integration will not work without proper OAuth credentials`);
    }
  }

  // Validate cron schedule
  if (SYNC_WORKER_CONFIG.enabled) {
    console.log(`✅ Sync worker enabled: ${SYNC_WORKER_CONFIG.cronSchedule} (${SYNC_WORKER_CONFIG.timezone})`);
  } else {
    console.log(`⚠️  Sync worker disabled (set SYNC_WORKER_ENABLED=true to enable)`);
  }
};

// Run validation on module load
validateConfig();

// Export default configuration object
const oauthConfig = {
  // OAuth credentials (root level for backward compatibility)
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  redirectUri: GOOGLE_REDIRECT_URI,
  scope: GOOGLE_FIT_OAUTH_SCOPE,

  // Grouped Google OAuth credentials
  google: {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI,
  },

  // Sync worker
  syncWorker: SYNC_WORKER_CONFIG,

  // Google Fit API
  googleFit: {
    ...GOOGLE_FIT_CONFIG,
    scopes: GOOGLE_FIT_OAUTH_SCOPE, // Add scopes to googleFit config
  },

  // State management
  state: OAUTH_STATE_CONFIG,

  // Token management
  token: TOKEN_CONFIG,

  // Validation
  validation: SCOPE_VALIDATION,
};

export default oauthConfig;