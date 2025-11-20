/**
 * @fileoverview Verify Analytics Model Indexes
 * @description Script to verify that Analytics collection indexes are created correctly
 *
 * Run: node scripts/verify-analytics-indexes.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Analytics from '../src/models/Analytics.js';

dotenv.config();

const verifyIndexes = async () => {
  try {
    console.log('🔍 Verifying Analytics Model Indexes...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Force index creation to ensure they exist for verification
    console.log('⏳ Syncing indexes...');
    await Analytics.syncIndexes();
    console.log('✅ Indexes synced\n');

    // Get collection
    const collection = mongoose.connection.db.collection('analytics');

    // Get all indexes
    const indexes = await collection.indexes();

    console.log('📊 Current Indexes on "analytics" collection:');
    console.log('================================================\n');

    indexes.forEach((index, i) => {
      console.log(`Index ${i + 1}: ${index.name}`);
      console.log(`  Keys: ${JSON.stringify(index.key)}`);
      if (index.unique) console.log(`  Unique: true`);
      if (index.expireAfterSeconds !== undefined) {
        console.log(`  TTL: expireAfterSeconds = ${index.expireAfterSeconds}`);
      }
      console.log('');
    });

    // Verify expected indexes
    const expectedIndexes = [
      '_id_',  // Default MongoDB index
      'userId_1',  // Single index on userId
      'calculatedAt_1',  // Single index on calculatedAt
      'analytics_user_metric_timerange',  // Compound index
      'analytics_user_calculated',  // Compound index
      'analytics_ttl',  // TTL index
      'analytics_metric_type'  // Single index on metricType
    ];

    console.log('🔎 Expected Indexes:');
    console.log('====================');
    expectedIndexes.forEach(name => console.log(`  - ${name}`));
    console.log('');

    // Check if all expected indexes exist
    const indexNames = indexes.map(idx => idx.name);
    const missing = expectedIndexes.filter(name => !indexNames.includes(name));

    if (missing.length === 0) {
      console.log('✅ All expected indexes are present!');
    } else {
      console.log('⚠️  Missing indexes:');
      missing.forEach(name => console.log(`  - ${name}`));
    }

    console.log('\n📋 Index Verification Summary:');
    console.log('================================');
    console.log(`  Total indexes: ${indexes.length}`);
    console.log(`  Expected indexes: ${expectedIndexes.length}`);
    console.log(`  Missing: ${missing.length}`);
    console.log(`  Status: ${missing.length === 0 ? '✅ PASS' : '❌ FAIL'}`);

    // Check TTL index specifically
    const ttlIndex = indexes.find(idx => idx.name === 'analytics_ttl');
    if (ttlIndex) {
      console.log('\n⏰ TTL Index Configuration:');
      console.log('============================');
      console.log(`  Field: expiresAt`);
      console.log(`  expireAfterSeconds: ${ttlIndex.expireAfterSeconds}`);
      console.log(`  ✅ Auto-cleanup enabled`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Verification complete. Database connection closed.');

  } catch (error) {
    console.error('❌ Error verifying indexes:', error.message);
    process.exit(1);
  }
};

verifyIndexes();