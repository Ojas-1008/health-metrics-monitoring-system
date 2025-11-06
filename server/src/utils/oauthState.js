/**
* server/utils/oauthState.js
* 
* CSRF state parameter management for OAuth flows
* Generates, stores, and validates cryptographically secure state tokens
* 
* Security: Prevents CSRF attacks during OAuth redirect
* How it works: State parameter must match between authorization request and callback
*/
import crypto from "crypto";

/**
 * In-memory state store with automatic expiration
 * In production, replace with Redis for distributed systems
 * 
 * Format: { [userId]: { state: "hex_string", expiresAt: timestamp } }
 */
const stateStore = new Map();

/**
 * Clean up expired state parameters
 * Runs every 5 minutes to prevent memory leaks
 */
const cleanupExpiredStates = () => {
  const now = Date.now();
  for (const [userId, data] of stateStore.entries()) {
    if (data.expiresAt < now) {
      stateStore.delete(userId);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredStates, 5 * 60 * 1000);

/**
 * Generate cryptographically secure CSRF state parameter
 * 
 * @param {string} userId - MongoDB user ID for state key storage
 * @returns {string} - 64-character hexadecimal state token
 */
export const generateOAuthState = (userId) => {
  // Generate 32 random bytes = 64 hex characters (256-bit security)
  const state = crypto.randomBytes(32).toString("hex");

  // Store state with 10-minute expiration
  const expiresAt = Date.now() + 10 * 60 * 1000;
  stateStore.set(userId, {
    state,
    expiresAt,
  });

  console.log(`✅ Generated OAuth state for user ${userId}: expires in 10 minutes`);
  return state;
};

/**
 * Validate state parameter from OAuth callback
 * CRITICAL: Deletes state immediately after validation to prevent replay attacks
 * 
 * @param {string} userId - MongoDB user ID
 * @param {string} receivedState - State parameter from Google callback
 * @returns {boolean} - True if state is valid and not expired
 * @throws {Error} - If state is missing, invalid, or expired
 */
export const validateOAuthState = (userId, receivedState) => {
  // Retrieve stored state
  const storedData = stateStore.get(userId);

  if (!storedData) {
    throw new Error("OAuth state not found. Please restart the OAuth flow.");
  }

  // Check expiration
  if (storedData.expiresAt < Date.now()) {
    stateStore.delete(userId); // Clean up expired state
    throw new Error(
      "OAuth state has expired (10-minute timeout). Please restart the OAuth flow."
    );
  }

  // Compare states using constant-time comparison
  // Prevents timing attacks that could reveal valid states
  if (receivedState.length !== storedData.state.length) {
    stateStore.delete(userId); // Clean up immediately
    throw new Error(
      "OAuth state mismatch. This may indicate a CSRF attack. Please try again."
    );
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(storedData.state),
    Buffer.from(receivedState)
  );

  // CRITICAL: Delete state IMMEDIATELY after validation
  // This prevents replay attacks where the same callback URL is used twice
  stateStore.delete(userId);

  if (!isValid) {
    throw new Error(
      "OAuth state mismatch. This may indicate a CSRF attack. Please try again."
    );
  }

  console.log(`✅ OAuth state validated and deleted for user ${userId} (one-time use enforced)`);

  return true;
};

/**
 * Get the userId associated with a state token
 * Used in callback to identify which user the state belongs to
 * 
 * @param {string} receivedState - State parameter from Google callback
 * @returns {string|null} - userId if found and not expired, null otherwise
 */
export const getUserIdFromState = (receivedState) => {
  const now = Date.now();
  
  // Search through all stored states to find matching one
  for (const [userId, data] of stateStore.entries()) {
    // Skip expired states
    if (data.expiresAt < now) {
      stateStore.delete(userId);
      continue;
    }
    
    // Check if this state matches
    try {
      if (crypto.timingSafeEqual(
        Buffer.from(data.state),
        Buffer.from(receivedState)
      )) {
        return userId;
      }
    } catch (err) {
      // timingSafeEqual throws if buffers are different lengths
      continue;
    }
  }
  
  return null;
};

/**
 * Clear all stored states for a user (useful for logout/disconnection)
 * 
 * @param {string} userId - MongoDB user ID
 */
export const clearOAuthState = (userId) => {
  stateStore.delete(userId);
  console.log(`🗑️  Cleared OAuth state for user ${userId}`);
};

export default {
  generateOAuthState,
  validateOAuthState,
  getUserIdFromState,
  clearOAuthState,
};