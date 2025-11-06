// server/scripts/mongoHelper.mjs
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/health_metrics';

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB disconnect failed:', error.message);
  }
}

export async function findUser(email) {
  try {
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ email });
    return user;
  } catch (error) {
    console.error('❌ Find user failed:', error.message);
    return null;
  }
}

export async function updateUserTokenExpiry(email, newExpiry) {
  try {
    const db = mongoose.connection.db;
    const result = await db.collection('users').updateOne(
      { email },
      { $set: { 'googleFitTokens.token_expiry': new Date(newExpiry) } }
    );
    console.log(`✅ Updated ${result.modifiedCount} user(s)`);
    return result;
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    return null;
  }
}

export async function showUserTokens(email) {
  try {
    const user = await findUser(email);
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('User ID:', user._id);
    console.log('Email:', user.email);
    console.log('Google Fit Connected:', user.googleFitConnected);

    if (user.googleFitTokens) {
      console.log('Token Expiry:', user.googleFitTokens.token_expiry);
      console.log('Has Access Token:', !!user.googleFitTokens.access_token);
      console.log('Has Refresh Token:', !!user.googleFitTokens.refresh_token);
      console.log('Scope:', user.googleFitTokens.scope);
    } else {
      console.log('No Google Fit tokens found');
    }
  } catch (error) {
    console.error('❌ Show tokens failed:', error.message);
  }
}

// CLI interface
const command = process.argv[2];
const email = process.argv[3];
const expiry = process.argv[4];

async function main() {
  await connectDB();

  switch (command) {
    case 'show':
      await showUserTokens(email);
      break;
    case 'update':
      await updateUserTokenExpiry(email, expiry);
      break;
    default:
      console.log('Usage:');
      console.log('  node mongoHelper.mjs show <email>');
      console.log('  node mongoHelper.mjs update <email> <expiry-date>');
      console.log('Example:');
      console.log('  node mongoHelper.mjs update ojasshrivastava1008@gmail.com "2025-11-05T00:00:00Z"');
  }

  await disconnectDB();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}