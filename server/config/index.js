/**
* server/config/index.js
* 
* Central configuration management
* Exports all environment variables with defaults and validation
*/
import dotenv from "dotenv";
import oauthConfig from "./oauth.config.js";

dotenv.config();

/**
* Master configuration object
* Provides single source of truth for all environment settings
*/
const config = {
  // Environment
  env: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isStaging: process.env.NODE_ENV === "staging",

  // Server
  port: parseInt(process.env.PORT || "5000"),
  serverUrl: process.env.SERVER_URL || "http://localhost:5000",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/health_metrics",
    retryAttempts: parseInt(process.env.MONGODB_RETRY_ATTEMPTS || "5"),
    retryInterval: parseInt(process.env.MONGODB_RETRY_INTERVAL || "5000"),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "development_secret_change_in_production",
    expire: process.env.JWT_EXPIRE || "7d",
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || "30d",
  },

  // OAuth (imported from oauth.config.js)
  oauth: oauthConfig,

  // CORS
  cors: {
    enabled: process.env.CORS_ENABLED !== "false",
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "debug",
    httpRequests: process.env.LOG_HTTP_REQUESTS !== "false",
  },

  // Rate limiting
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== "false",
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS || "100"),
    window: parseInt(process.env.RATE_LIMIT_WINDOW || "15"),
  },

  // Security
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5"),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || "30"),
  },
};

/**
* Validate critical configuration in production
*/
if (config.isProduction) {
  const requiredKeys = [
    "mongodb.uri",
    "jwt.secret",
    "oauth.google.clientId",
    "oauth.google.clientSecret",
  ];

  requiredKeys.forEach((key) => {
    const value = key.split(".").reduce((obj, k) => obj?.[k], config);
    if (!value || value.includes("your_") || value.includes("change_")) {
      throw new Error(
        `❌ FATAL: Missing or placeholder production config: ${key}\n` +
        `Set actual values in environment variables before deploying`
      );
    }
  });

  console.log("✅ Production configuration validated");
}

export default config;