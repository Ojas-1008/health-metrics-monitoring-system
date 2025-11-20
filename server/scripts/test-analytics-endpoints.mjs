import fetch from 'node-fetch';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://127.0.0.1:5000/api';
const EMAIL = 'ojasshrivastava1008@gmail.com';
const PASSWORD = 'Krishna@1008';

async function runTest() {
  try {
    console.log('🚀 Starting Analytics Endpoint Test...\n');

    // 1. Login
    console.log('🔑 Logging in...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
    }

    const loginData = await loginRes.json();
    console.log('DEBUG: Login response:', JSON.stringify(loginData, null, 2));
    const token = loginData.token;
    const userId = loginData.user ? loginData.user.id : undefined;
    console.log('DEBUG: User ID from login:', userId);
    console.log('✅ Login successful. Token received.\n');

    // 2. Get Analytics (Expect empty or existing)
    console.log('📡 Fetching analytics (initial check)...');
    const initialRes = await fetch(`${API_URL}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const initialData = await initialRes.json();
    console.log(`📊 Initial count: ${initialData.count}`);
    if (initialData.data.length > 0) {
        console.log('DEBUG: Existing doc userId:', initialData.data[0].userId);
    }
    console.log('-----------------------------------');

    // 3. Insert Test Document
    console.log('\n📝 Inserting test analytics document...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const testDoc = {
      userId: new mongoose.Types.ObjectId(userId),
      metricType: 'steps',
      timeRange: '7day',
      analytics: {
        rollingAverage: 7500,
        trend: 'up',
        trendPercentage: 5.2,
        anomalyDetected: false,
        streakDays: 3,
        percentile: 65,
        comparisonToPrevious: {
          absoluteChange: 500,
          percentageChange: 7.1,
          isImprovement: true
        }
      },
      calculatedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    };

    const inserted = await mongoose.connection.db.collection('analytics').insertOne(testDoc);
    console.log(`✅ Test document inserted with ID: ${inserted.insertedId}\n`);

    // 4. Get Analytics Again (Verify retrieval)
    console.log('📡 Fetching analytics (verification check)...');
    const verifyRes = await fetch(`${API_URL}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const verifyData = await verifyRes.json();
    console.log(`📊 New count: ${verifyData.count}`);
    
    console.log('DEBUG: IDs returned by API:', verifyData.data.map(d => d._id));
    console.log('DEBUG: Inserted ID:', inserted.insertedId.toString());

    const found = verifyData.data.find(d => d._id === inserted.insertedId.toString());
    if (found) {
      console.log('✅ Test document successfully retrieved via API!');
      console.log('   Metric:', found.metricType);
      console.log('   Rolling Avg:', found.analytics.rollingAverage);
    } else {
      console.error('❌ Test document NOT found in API response.');
    }

    // 5. Cleanup
    console.log('\n🧹 Cleaning up test document...');
    await mongoose.connection.db.collection('analytics').deleteOne({ _id: inserted.insertedId });
    console.log('✅ Cleanup complete.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

runTest();
