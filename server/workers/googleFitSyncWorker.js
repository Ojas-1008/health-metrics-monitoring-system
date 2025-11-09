/**
 * server/workers/googleFitSyncWorker.js
 *
 * Google Fit data synchronization worker
 * Scheduled cron job to fetch health metrics from Google Fit API
 * and store them in MongoDB for all connected users
 *
 * How it works:
 * 1. Runs on SYNC_CRON_SCHEDULE (default: every 15 minutes)
 * 2. Fetches up to SYNC_BATCH_SIZE users (default: 50)
 * 3. Queries Google Fit API for latest health data
 * 4. Stores metrics in HealthMetric collection
 * 5. Updates lastSyncAt timestamp
 *
 * Pattern: Uses node-cron for scheduling, async/await for execution
 */

import cron from "node-cron";
import axios from "axios";
import User from "../src/models/User.js";
import HealthMetric from "../src/models/HealthMetric.js";
import oauthConfig from "../src/config/oauth.config.js";
import { refreshGoogleFitToken, getValidAccessToken } from "../src/utils/googleFitHelper.js";

/**
 * ============================================
 * CONFIGURATION
 * ============================================
 */

// Get configuration from oauth.config.js (populated from environment variables)
const CRON_SCHEDULE = oauthConfig.syncWorker.cronSchedule; // "*/15 * * * *"
const BATCH_SIZE = oauthConfig.syncWorker.batchSize; // 50
const WORKER_ENABLED = oauthConfig.syncWorker.enabled; // true
const GOOGLE_FIT_API_BASE = oauthConfig.googleFit.apiBaseUrl;
const API_TIMEOUT = oauthConfig.googleFit.apiTimeout;

// Worker state tracking
let isRunning = false;
let lastRunTime = null;
let totalSyncsCompleted = 0;
let totalSyncsFailed = 0;

/**
 * ============================================
 * GOOGLE FIT DATA SOURCE DEFINITIONS
 * ============================================
 *
 * Android phone-only data sources (no wearables)
 * Each data source has a specific endpoint and aggregation method
 */
const GOOGLE_FIT_DATA_SOURCES = {
  steps: {
    dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
    field: "intVal",
    unit: "steps",
    aggregation: "sum",
  },
  distance: {
    dataSourceId: "derived:com.google.distance.delta:com.google.android.gms",
    field: "fpVal",
    unit: "meters",
    aggregation: "sum",
  },
  calories: {
    dataSourceId: "derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended",
    field: "fpVal",
    unit: "calories",
    aggregation: "sum",
  },
  activeMinutes: {
    dataSourceId: "derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes",
    field: "intVal",
    unit: "minutes",
    aggregation: "sum",
  },
  
  // ⭐ FIXED: Heart Points now uses fpVal
  heartPoints: {
    dataSourceId: "derived:com.google.heart_minutes:com.google.android.gms:merge_heart_minutes",
    field: "fpVal",  // ✅ Changed from intVal to fpVal
    unit: "points",
    aggregation: "sum",
  },
  
  weight: {
    dataSourceId: "derived:com.google.weight:com.google.android.gms:merge_weight",
    field: "fpVal",
    unit: "kg",
    aggregation: "last",
  },
  sleep: {
    dataSourceId: "derived:com.google.sleep.segment:com.google.android.gms",
    field: "intVal",
    unit: "milliseconds",
    aggregation: "sum",
  },
  height: {
    dataSourceId: "derived:com.google.height:com.google.android.gms:merge_height",
    field: "fpVal",
    unit: "meters",
    aggregation: "last",
  },
  bloodPressure: {
    dataSourceId: "derived:com.google.blood_pressure:com.google.android.gms:merged",
    field: "mapVal",
    unit: "mmHg",
    aggregation: "last",
  },
  heartRate: {
    dataSourceId: "derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm",
    field: "fpVal",
    unit: "bpm",
    aggregation: "average",
  },
  oxygenSaturation: {
    dataSourceId: "derived:com.google.oxygen_saturation:com.google.android.gms:merged",
    field: "fpVal",
    unit: "percentage",
    aggregation: "average",
  },
  bodyTemperature: {
    dataSourceId: "derived:com.google.body.temperature:com.google.android.gms:merged",
    field: "fpVal",
    unit: "celsius",
    aggregation: "average",
  },
  hydration: {
    dataSourceId: "derived:com.google.hydration:com.google.android.gms:merged",
    field: "fpVal",
    unit: "liters",
    aggregation: "sum",
  },
};

/**
 * ============================================
 * HELPER: DETERMINE SYNC WINDOW (FIXED)
 * ============================================
 * 
 * Calculate start and end timestamps for Google Fit API queries
 * Ensures minimum window of 24 hours to capture meaningful data
 * 
 * @param {Date|null} lastSyncAt - Last successful sync timestamp
 * @returns {Object} { startTimeMs, endTimeMs, startDate, endDate }
 */
const determineSyncWindow = (lastSyncAt) => {
  const now = new Date();
  let startDate;

  if (!lastSyncAt) {
    // First sync: fetch last 30 days
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    console.log(`    ℹ️  First sync: Fetching last 30 days`);
  } else {
    // Subsequent sync: fetch from lastSyncAt to now
    startDate = new Date(lastSyncAt);

    // ⭐ CRITICAL FIX: Ensure minimum window of 24 hours
    // Google Fit aggregates data and may not have data in very short windows
    const hoursSinceLastSync = (now - startDate) / (1000 * 60 * 60);
    
    if (hoursSinceLastSync < 24) {
      console.log(`    ⚠️  Last sync was ${hoursSinceLastSync.toFixed(1)} hours ago (< 24h)`);
      console.log(`    📅 Expanding window to last 24 hours for better data coverage`);
      
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // Last 24 hours
    } else {
      console.log(`    ✓ Sync window is ${hoursSinceLastSync.toFixed(1)} hours (good)`);
    }

    // Cap sync window at 30 days to prevent excessive API calls
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (startDate < thirtyDaysAgo) {
      console.log(`    ⚠️  Sync window exceeds 30 days, capping to 30 days`);
      startDate = thirtyDaysAgo;
    }
  }

  // Convert to nanoseconds (Google Fit API requirement)
  const startTimeMs = startDate.getTime();
  const endTimeMs = now.getTime();

  const windowHours = ((endTimeMs - startTimeMs) / (1000 * 60 * 60)).toFixed(1);
  const windowDays = (windowHours / 24).toFixed(1);
  
  console.log(`    📅 Final sync window: ${windowDays} days (${windowHours} hours)`);
  console.log(`       From: ${startDate.toISOString()}`);
  console.log(`       To:   ${now.toISOString()}`);

  return {
    startTimeMs,
    endTimeMs,
    startTimeNanos: startTimeMs * 1000000,
    endTimeNanos: endTimeMs * 1000000,
    startDate,
    endDate: now,
  };
};

/**
 * ============================================
 * HELPER: FETCH DATA FROM GOOGLE FIT API
 * ============================================
 *
 * Fetches data for a specific data source from Google Fit API
 * Enhanced error handling for 401 (invalid/insufficient scopes),
 * 403 (permissions denied), 404 (data not available), and 429 (rate limit)
 *
 * @param {string} accessToken - Valid OAuth access token
 * @param {string} dataSourceId - Google Fit data source identifier
 * @param {number} startTimeNanos - Start time in nanoseconds
 * @param {number} endTimeNanos - End time in nanoseconds
 * @returns {Promise<Array>} Data points array or empty array if 404/403
 * @throws {Error} If 401 (invalid token) or 429 after retry
 */
const fetchGoogleFitData = async (
  accessToken,
  dataSourceId,
  startTimeNanos,
  endTimeNanos
) => {
  const url = `${GOOGLE_FIT_API_BASE}/dataSources/${dataSourceId}/datasets/${startTimeNanos}-${endTimeNanos}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: API_TIMEOUT,
    });

    return response.data.point || [];
  } catch (error) {
    // Handle 404: Data type not available for this user
    if (error.response && error.response.status === 404) {
      console.log(`    ℹ️  Data source not available: ${dataSourceId}`);
      return [];
    }

    // Handle 401: Invalid or insufficient token scopes
    if (error.response && error.response.status === 401) {
      console.error(`    🚨 401 UNAUTHORIZED for ${dataSourceId}`);
      console.error(`       Token may be invalid or missing required scopes`);
      console.error(`       User needs to reconnect Google Fit with all permissions`);
      
      // Throw error to trigger user disconnection
      throw new Error(
        `401 Unauthorized: Token invalid or missing fitness scopes. User must reconnect.`
      );
    }

    // Handle 403: Forbidden (token valid but permissions denied)
    if (error.response && error.response.status === 403) {
      console.error(`    🚨 403 FORBIDDEN for ${dataSourceId}`);
      console.error(`       Token is valid but user denied access to this data type`);
      return [];
    }

    // Handle 429: Rate limit exceeded
    if (error.response && error.response.status === 429) {
      console.error(`    ⏰ 429 RATE LIMIT EXCEEDED`);
      console.error(`       Too many requests. Retrying after delay...`);
      
      // Wait and retry once
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const retryResponse = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: API_TIMEOUT,
      });
      
      return retryResponse.data.point || [];
    }

    // Log detailed error for debugging
    console.error(`    ❌ API Error for ${dataSourceId}:`);
    console.error(`       Status: ${error.response?.status || 'Unknown'}`);
    console.error(`       Message: ${error.response?.data?.error?.message || error.message}`);
    
    // Re-throw error
    throw error;
  }
};

/**
 * ============================================
 * HELPER: AGGREGATE DATA BY DAY (ENHANCED)
 * ============================================
 *
 * Groups raw Google Fit data points by day and aggregates values
 * Enhanced to handle blood pressure (multiple values) and average aggregation
 *
 * @param {Array} dataPoints - Raw data points from Google Fit API
 * @param {string} field - Field name to extract (intVal, fpVal, or mapVal)
 * @param {string} aggregation - Aggregation method (sum, last, or average)
 * @returns {Object} { date: aggregatedValue } map
 */
const aggregateByDay = (dataPoints, field, aggregation = "sum") => {
  const dailyData = {};

  dataPoints.forEach((point) => {
    // Extract timestamp and normalize to midnight UTC
    const endTimeMs = parseInt(point.endTimeNanos) / 1000000;
    const date = new Date(endTimeMs);
    date.setUTCHours(0, 0, 0, 0);
    const dayKey = date.toISOString().split("T")[0]; // "YYYY-MM-DD"

    // Handle different field types
    let value;
    if (field === "mapVal") {
      // Blood pressure has multiple values (systolic/diastolic)
      const mapData = point.value && point.value[0] ? point.value[0][field] : null;
      if (mapData) {
        // Extract systolic and diastolic values
        value = {
          systolic: mapData.find(item => item.key === "systolic")?.value?.fpVal || null,
          diastolic: mapData.find(item => item.key === "diastolic")?.value?.fpVal || null,
        };
      } else {
        value = { systolic: null, diastolic: null };
      }
    } else {
      value = point.value && point.value[0] ? point.value[0][field] : 0;
    }

    if (aggregation === "sum") {
      // Sum all values for the day
      if (typeof value === "object") {
        // Handle blood pressure (sum each component)
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { systolic: 0, diastolic: 0 };
        }
        dailyData[dayKey].systolic += value.systolic || 0;
        dailyData[dayKey].diastolic += value.diastolic || 0;
      } else {
        dailyData[dayKey] = (dailyData[dayKey] || 0) + value;
      }
    } else if (aggregation === "last") {
      // Use most recent value
      dailyData[dayKey] = value;
    } else if (aggregation === "average") {
      // Calculate average
      if (typeof value === "object") {
        // Handle blood pressure (average each component)
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { systolic: { sum: 0, count: 0 }, diastolic: { sum: 0, count: 0 } };
        }
        if (value.systolic !== null) {
          dailyData[dayKey].systolic.sum += value.systolic;
          dailyData[dayKey].systolic.count += 1;
        }
        if (value.diastolic !== null) {
          dailyData[dayKey].diastolic.sum += value.diastolic;
          dailyData[dayKey].diastolic.count += 1;
        }
      } else {
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { sum: 0, count: 0 };
        }
        dailyData[dayKey].sum += value;
        dailyData[dayKey].count += 1;
      }
    }
  });

  // Finalize averages
  if (aggregation === "average") {
    Object.keys(dailyData).forEach((key) => {
      if (typeof dailyData[key] === "object") {
        // Handle blood pressure averages
        if (dailyData[key].systolic) {
          dailyData[key].systolic = dailyData[key].systolic.count > 0
            ? Math.round(dailyData[key].systolic.sum / dailyData[key].systolic.count)
            : null;
        }
        if (dailyData[key].diastolic) {
          dailyData[key].diastolic = dailyData[key].diastolic.count > 0
            ? Math.round(dailyData[key].diastolic.sum / dailyData[key].diastolic.count)
            : null;
        }
      } else {
        // Handle simple averages
        dailyData[key] = dailyData[key].count > 0
          ? Math.round(dailyData[key].sum / dailyData[key].count)
          : 0;
      }
    });
  }

  return dailyData;
};

/**
 * ============================================
 * MAIN: SYNC USER GOOGLE FIT DATA
 * ============================================
 *
 * Comprehensive sync function that:
 * 1. Determines sync window (30 days max)
 * 2. Fetches data from Google Fit API for all data types
 * 3. Aggregates raw data by day
 * 4. Upserts daily metrics to HealthMetric collection
 * 5. Updates user.lastSyncAt atomically
 *
 * @param {Object} user - User document with tokens and sync preferences
 * @returns {Promise<Object>} Sync result with statistics
 */
const syncUserGoogleFitData = async (user) => {
  const startTime = Date.now();

  try {
    console.log(`  📊 Syncing Google Fit data for ${user.email}...`);

    // ===== STEP 1: DETERMINE SYNC WINDOW =====
    console.log(`    🔍 DEBUG: user.lastSyncAt = ${user.lastSyncAt}`);
    const syncWindow = determineSyncWindow(user.lastSyncAt);
    console.log(
      `    📅 Sync window: ${syncWindow.startDate.toISOString()} to ${syncWindow.endDate.toISOString()}`
    );

    // ===== STEP 2: GET VALID ACCESS TOKEN =====
    const accessToken = await getValidAccessToken(user._id);
    console.log(`    🔑 Access token retrieved`);

    // ===== STEP 3: FETCH DATA FROM GOOGLE FIT API =====
    const fetchedData = {};

    // Only fetch enabled data types based on user preferences
    const dataTypesToFetch = Object.keys(GOOGLE_FIT_DATA_SOURCES).filter(
      (type) => user.syncPreferences.enabledDataTypes[type] !== false
    );

    console.log(`    📥 Fetching data for: ${dataTypesToFetch.join(", ")}`);

    for (const dataType of dataTypesToFetch) {
      const dataSource = GOOGLE_FIT_DATA_SOURCES[dataType];

      try {
        let dataPoints = await fetchGoogleFitData(
          accessToken,
          dataSource.dataSourceId,
          syncWindow.startTimeNanos,
          syncWindow.endTimeNanos
        );

        // If no data points and fallback exists, try fallback data source
        if (dataPoints.length === 0 && dataSource.fallback) {
          console.log(`      ℹ️  Primary data source empty for ${dataType}, trying fallback...`);
          try {
            dataPoints = await fetchGoogleFitData(
              accessToken,
              dataSource.fallback,
              syncWindow.startTimeNanos,
              syncWindow.endTimeNanos
            );
            console.log(`      ✓ ${dataType}: ${dataPoints.length} data points fetched from fallback`);
          } catch (fallbackError) {
            console.log(`      ℹ️  Fallback also failed for ${dataType}: ${fallbackError.message}`);
          }
        }

        console.log(
          `      ✓ ${dataType}: ${dataPoints.length} data points fetched`
        );

        // Aggregate data by day
        fetchedData[dataType] = aggregateByDay(
          dataPoints,
          dataSource.field,
          dataSource.aggregation
        );
      } catch (error) {
        console.error(
          `      ✗ ${dataType}: Fetch failed - ${error.message}`
        );
        // Continue with other data types even if one fails
      }
    }

    // ===== STEP 4: TRANSFORM AND UPSERT DAILY METRICS =====
    const allDates = new Set();

    // Collect all unique dates across all data types
    Object.values(fetchedData).forEach((dailyData) => {
      Object.keys(dailyData).forEach((date) => allDates.add(date));
    });

    console.log(`    💾 Upserting ${allDates.size} days of metrics...`);

    let upsertedCount = 0;
    const upsertPromises = [];

    for (const dateStr of allDates) {
      const dayDate = new Date(dateStr);

      // Build metrics object for this day
      const metrics = {
        steps: fetchedData.steps?.[dateStr] || 0,
        distance:
          (fetchedData.distance?.[dateStr] || 0) / 1000, // Convert meters to km
        calories: Math.round(fetchedData.calories?.[dateStr] || 0),
        activeMinutes: fetchedData.activeMinutes?.[dateStr] || 0,
        
        // ⭐ ADD: Heart Points
        heartPoints: fetchedData.heartPoints?.[dateStr] || 0,
        
        // ⭐ ADD: Move Minutes
        moveMinutes: fetchedData.moveMinutes?.[dateStr] || 0,
        
        weight: fetchedData.weight?.[dateStr] || null,
        sleepHours: fetchedData.sleep?.[dateStr]
          ? Math.round((fetchedData.sleep[dateStr] / 1000 / 60 / 60) * 10) / 10 // Convert ms to hours
          : null,
        
        // ⭐ NEW METRICS (Wearable Device Data) ⭐
        
        height: fetchedData.height?.[dateStr]
          ? Math.round(fetchedData.height[dateStr] * 100) // meters to cm
          : null,
        
        bloodPressure: fetchedData.bloodPressure?.[dateStr]
          ? {
              systolic: fetchedData.bloodPressure[dateStr].systolic || null,
              diastolic: fetchedData.bloodPressure[dateStr].diastolic || null,
            }
          : { systolic: null, diastolic: null },
        
        heartRate: fetchedData.heartRate?.[dateStr] || null,
        
        oxygenSaturation: fetchedData.oxygenSaturation?.[dateStr] || null,
        
        bodyTemperature: fetchedData.bodyTemperature?.[dateStr] || null,
        
        hydration: fetchedData.hydration?.[dateStr] || null,
      };

      // Upsert to HealthMetric collection
      const upsertPromise = HealthMetric.findOneAndUpdate(
        {
          userId: user._id,
          date: dayDate,
        },
        {
          $set: {
            metrics,
            source: "googlefit",
            syncedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );

      upsertPromises.push(upsertPromise);
    }

    // Execute all upserts in parallel
    await Promise.all(upsertPromises);
    upsertedCount = allDates.size;

    console.log(`    ✅ Upserted ${upsertedCount} health metric documents`);

    // ===== STEP 5: UPDATE USER lastSyncAt ATOMICALLY =====
    // Use findByIdAndUpdate to ensure atomic update
    // This prevents incorrect lastSyncAt if crash occurs mid-sync
    // IMPORTANT: Set to syncWindow.endDate (not new Date()) so next sync continues from where this one ended
    await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          lastSyncAt: syncWindow.endDate,
        },
      },
      { new: true }
    );

    console.log(`    ✅ Updated lastSyncAt timestamp`);

    const duration = Date.now() - startTime;

    return {
      success: true,
      userId: user._id,
      email: user.email,
      duration,
      metricsStored: upsertedCount,
      syncWindow: {
        start: syncWindow.startDate.toISOString(),
        end: syncWindow.endDate.toISOString(),
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(`  ❌ Sync error for ${user.email}: ${error.message}`);

    // If error is 401 (unauthorized), user needs to reconnect
    if (error.statusCode === 401) {
      console.warn(`  🚨 User ${user.email} needs to reconnect Google Fit`);
    }

    return {
      success: false,
      userId: user._id,
      email: user.email,
      error: error.message,
      duration,
    };
  }
};

/**
 * ============================================
 * SYNC ALL USERS (ENHANCED WITH BATCH PROCESSING)
 * ============================================
 *
 * Main sync function with:
 * - Batch size limiting (SYNC_BATCH_SIZE)
 * - Token refresh checks (5-minute threshold)
 * - Parallel processing (Promise.allSettled)
 * - Comprehensive statistics and logging
 *
 * Process:
 * 1. Query connected users (limit: BATCH_SIZE)
 * 2. Check and refresh tokens if needed
 * 3. Sync users in parallel (Promise.allSettled)
 * 4. Log detailed statistics
 *
 * @returns {Promise<Object>} Sync results with statistics
 */
const syncAllUsers = async () => {
  // Prevent concurrent runs
  if (isRunning) {
    console.log("⏩ Sync already in progress, skipping this run");
    return { succeeded: 0, failed: 0, skipped: 0 };
  }

  isRunning = true;
  const syncStartTime = Date.now();
  lastRunTime = new Date();

  console.log("\n========================================");
  console.log("🔄 GOOGLE FIT SYNC WORKER STARTED");
  console.log("========================================");
  console.log(`Time: ${lastRunTime.toISOString()}`);
  console.log(`Batch Size: ${BATCH_SIZE} users`);
  console.log(`Schedule: ${CRON_SCHEDULE}`);

  const results = {
    succeeded: 0,
    failed: 0,
    skipped: 0,
    tokenRefreshes: 0,
    totalDuration: 0,
    errors: [],
    userResults: [],
  };

  try {
    // ===== STEP 1: QUERY CONNECTED USERS =====
    console.log("\n📋 Querying connected users...");

    const users = await User.find({
      googleFitConnected: true,
    })
      .sort({ lastSyncAt: 1 }) // Prioritize users who haven't synced recently
      .limit(parseInt(process.env.SYNC_BATCH_SIZE) || BATCH_SIZE)
      .select("+googleFitTokens"); // Include tokens (excluded by default), other fields auto-included

    if (users.length === 0) {
      console.log("ℹ️  No connected users found to sync");
      isRunning = false;
      return results;
    }

    console.log(`✅ Found ${users.length} users to sync`);
    console.log(`   Users: ${users.map(u => u.email).join(", ")}`);

    // ===== STEP 2: CHECK AND REFRESH TOKENS IF NEEDED =====
    console.log("\n🔑 Checking token expiry for all users...");

    for (const user of users) {
      try {
        // Check if token expires within 5 minutes
        const tokenExpiry = new Date(user.googleFitTokens.token_expiry);
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        if (tokenExpiry <= fiveMinutesFromNow) {
          console.log(`  🔄 Refreshing token for ${user.email} (expires: ${tokenExpiry.toISOString()})`);

          await refreshGoogleFitToken(user._id.toString());
          results.tokenRefreshes++;

          console.log(`  ✅ Token refreshed for ${user.email}`);
        } else {
          const minutesUntilExpiry = Math.floor((tokenExpiry - now) / 1000 / 60);
          console.log(`  ✓ Token valid for ${user.email} (expires in ${minutesUntilExpiry} minutes)`);
        }
      } catch (error) {
        console.error(`  ❌ Token refresh failed for ${user.email}: ${error.message}`);

        // Log error but continue with other users
        results.errors.push({
          userId: user._id,
          email: user.email,
          error: `Token refresh failed: ${error.message}`,
        });

        // Skip this user if token refresh failed
        results.skipped++;
      }
    }

    // ===== STEP 3: SYNC USERS IN PARALLEL =====
    console.log("\n🚀 Starting parallel sync for all users...");

    // Filter out users whose tokens failed to refresh
    const usersToSync = users.filter(user => {
      const hasError = results.errors.some(err => err.userId.equals(user._id));
      return !hasError;
    });

    if (usersToSync.length === 0) {
      console.log("⚠️  No users available to sync (all token refreshes failed)");
      isRunning = false;
      return results;
    }

    // Use Promise.allSettled for parallel execution
    // This ensures one user's failure doesn't stop others
    const syncPromises = usersToSync.map(user => syncUserGoogleFitData(user));
    const syncResults = await Promise.allSettled(syncPromises);

    // ===== STEP 4: PROCESS RESULTS =====
    console.log("\n📊 Processing sync results...");

    syncResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const syncResult = result.value;

        if (syncResult.success) {
          results.succeeded++;
          console.log(`  ✅ ${syncResult.email}: Success (${syncResult.duration}ms)`);
        } else {
          results.failed++;
          results.errors.push({
            userId: syncResult.userId,
            email: syncResult.email,
            error: syncResult.error,
          });
          console.log(`  ❌ ${syncResult.email}: Failed - ${syncResult.error}`);
        }

        results.userResults.push(syncResult);
        results.totalDuration += syncResult.duration;
      } else {
        // Promise rejected (shouldn't happen with our error handling, but just in case)
        results.failed++;
        const user = usersToSync[index];
        console.log(`  ❌ ${user.email}: Promise rejected - ${result.reason}`);

        results.errors.push({
          userId: user._id,
          email: user.email,
          error: `Promise rejected: ${result.reason}`,
        });
      }
    });

    // ===== STEP 5: UPDATE GLOBAL STATISTICS =====
    totalSyncsCompleted += results.succeeded;
    totalSyncsFailed += results.failed;

    // ===== STEP 6: LOG SUMMARY STATISTICS =====
    const totalSyncDuration = Date.now() - syncStartTime;
    const avgDurationPerUser = results.userResults.length > 0
      ? Math.round(results.totalDuration / results.userResults.length)
      : 0;

    console.log("\n========================================");
    console.log("✅ SYNC WORKER COMPLETED");
    console.log("========================================");
    console.log(`Total Duration: ${totalSyncDuration}ms`);
    console.log(`Users Processed: ${users.length}`);
    console.log(`  ✅ Succeeded: ${results.succeeded}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  ⏭️  Skipped: ${results.skipped}`);
    console.log(`Token Refreshes: ${results.tokenRefreshes}`);
    console.log(`Average Sync Duration: ${avgDurationPerUser}ms per user`);
    console.log(`\nCumulative Statistics:`);
    console.log(`  Total Syncs Completed: ${totalSyncsCompleted}`);
    console.log(`  Total Syncs Failed: ${totalSyncsFailed}`);
    console.log(`  Success Rate: ${totalSyncsCompleted + totalSyncsFailed > 0
      ? ((totalSyncsCompleted / (totalSyncsCompleted + totalSyncsFailed)) * 100).toFixed(2)
      : 0}%`);

    // Log errors if any
    if (results.errors.length > 0) {
      console.log(`\n⚠️  Errors (${results.errors.length}):`);
      results.errors.forEach(err => {
        console.log(`  - ${err.email}: ${err.error}`);
      });
    }

    console.log("========================================\n");
  } catch (error) {
    console.error("\n❌ SYNC WORKER FATAL ERROR:");
    console.error(error);
    console.log("========================================\n");
  } finally {
    isRunning = false;
  }

  return results;
};

/**
 * ============================================
 * START SYNC WORKER
 * ============================================
 *
 * Initializes the cron job and starts scheduled syncing
 * Should be called after database connection is established
 *
 * @returns {Object} Cron job instance (can be stopped with job.stop())
 *
 * Usage in server.js:
 * ```
 * import { startSyncWorker } from './workers/googleFitSyncWorker.js';
 *
 * // After connectDB()
 * startSyncWorker();
 * ```
 */
export const startSyncWorker = () => {
  // Check if worker is enabled
  if (!WORKER_ENABLED) {
    console.log("\n⚠️  Google Fit Sync Worker is DISABLED");
    console.log("Set SYNC_WORKER_ENABLED=true in .env to enable\n");
    return null;
  }

  console.log("\n========================================");
  console.log("🚀 INITIALIZING GOOGLE FIT SYNC WORKER");
  console.log("========================================");
  console.log(`Schedule: ${CRON_SCHEDULE}`);
  console.log(`Batch Size: ${BATCH_SIZE} users per run`);
  console.log(`Status: ENABLED`);
  console.log("========================================\n");

  // Validate cron schedule
  if (!cron.validate(CRON_SCHEDULE)) {
    console.error(`❌ Invalid cron schedule: ${CRON_SCHEDULE}`);
    console.error("Please fix SYNC_CRON_SCHEDULE in .env");
    return null;
  }

  // Create cron job
  const syncJob = cron.schedule(
    CRON_SCHEDULE,
    async () => {
      await syncAllUsers();
    },
    {
      scheduled: true, // Start immediately
      timezone: "Asia/Kolkata", // IST timezone
    }
  );

  console.log("✅ Sync worker started successfully");
  console.log(`⏰ Next run: Check console for cron execution\n`);

  return syncJob;
};

/**
 * ============================================
 * STOP SYNC WORKER
 * ============================================
 *
 * Gracefully stops the cron job
 * Useful for testing or server shutdown
 *
 * @param {Object} Cron job instance from startSyncWorker()
 */
export const stopSyncWorker = (job) => {
  if (job) {
    job.stop();
    console.log("🛑 Sync worker stopped");
  }
};

/**
 * ============================================
 * GET WORKER STATUS
 * ============================================
 *
 * Returns current worker statistics
 * Useful for monitoring endpoints
 *
 * @returns {Object} Worker status and statistics
 */
export const getWorkerStatus = () => {
  return {
    enabled: WORKER_ENABLED,
    schedule: CRON_SCHEDULE,
    batchSize: BATCH_SIZE,
    isRunning,
    lastRunTime: lastRunTime ? lastRunTime.toISOString() : null,
    statistics: {
      totalSyncsCompleted,
      totalSyncsFailed,
      successRate:
        totalSyncsCompleted + totalSyncsFailed > 0
          ? (
              (totalSyncsCompleted / (totalSyncsCompleted + totalSyncsFailed)) *
              100
            ).toFixed(2) + "%"
          : "N/A",
    },
  };
};

/**
 * ============================================
 * MANUAL SYNC TRIGGER
 * ============================================
 *
 * Manually trigger a sync (for testing or admin endpoints)
 *
 * @returns {Promise<Object>} Sync results
 */
export const triggerManualSync = async () => {
  console.log("🔧 Manual sync triggered");
  return await syncAllUsers();
};

// Export all functions
export default {
  startSyncWorker,
  stopSyncWorker,
  getWorkerStatus,
  triggerManualSync,
  syncAllUsers,
};