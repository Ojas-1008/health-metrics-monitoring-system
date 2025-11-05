/**
 * ============================================================================
 * JWT Token Generator Utility
 * ============================================================================
 * 
 * Generates valid JWT tokens for testing and development purposes
 * 
 * Usage:
 *   node generate-token.js                    # Interactive mode
 *   node generate-token.js <userId>           # Generate token for specific user
 *   node generate-token.js --test             # Generate token for test user
 * 
 * Example:
 *   node generate-token.js 507f1f77bcf86cd799439011
 *   node generate-token.js --test
 */

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/models/User.js";
import connectDB from "./src/config/database.js";

dotenv.config();

/**
 * Generate JWT token for a given user ID
 * @param {string} userId - MongoDB user ID
 * @returns {string} - JWT token
 */
function generateToken(userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
  return token;
}

/**
 * Get or create test user
 * @returns {Promise<Object>} - User document
 */
async function getOrCreateTestUser() {
  try {
    await connectDB();

    const testEmail = "testuser@example.com";
    const testPassword = "Test@1234";

    // Check if test user exists
    let user = await User.findOne({ email: testEmail });

    if (user) {
      console.log(`✅ Found existing test user: ${testEmail}`);
      return user;
    }

    // Create new test user
    user = await User.create({
      name: "Test User",
      email: testEmail,
      password: testPassword,
    });

    console.log(`✨ Created new test user: ${testEmail}`);
    return user;
  } catch (error) {
    console.error("❌ Error getting/creating test user:", error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const args = process.argv.slice(2);

    let userId;

    // Parse command line arguments
    if (args.length === 0) {
      // Interactive mode - create test user
      console.log("\n📝 Token Generator - Interactive Mode\n");
      const testUser = await getOrCreateTestUser();
      userId = testUser._id.toString();
      console.log(`🔑 User ID: ${userId}`);
    } else if (args[0] === "--test") {
      // Test user mode
      console.log("\n📝 Token Generator - Test User Mode\n");
      const testUser = await getOrCreateTestUser();
      userId = testUser._id.toString();
      console.log(`🔑 User ID: ${userId}`);
    } else {
      // Direct user ID provided
      userId = args[0];
      console.log(`\n📝 Token Generator - Direct Mode\n`);
      console.log(`🔑 User ID: ${userId}`);
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error(`Invalid MongoDB ObjectId: ${userId}`);
    }

    // Generate token
    const token = generateToken(userId);

    // Decode token to show details
    const decoded = jwt.decode(token);
    const expiryDate = new Date(decoded.exp * 1000);

    console.log("\n✅ Token Generated Successfully!\n");
    console.log("━".repeat(80));
    console.log("\n🔐 JWT Token:\n");
    console.log(token);
    console.log("\n━".repeat(80));
    console.log("\n📊 Token Details:");
    console.log(`   User ID:    ${decoded.id}`);
    console.log(`   Issued At:  ${new Date(decoded.iat * 1000).toISOString()}`);
    console.log(`   Expires At: ${expiryDate.toISOString()}`);
    console.log(`   Expires In: ${process.env.JWT_EXPIRE || "7d"}`);
    console.log("\n💡 Usage in curl:\n");
    console.log(
      `   curl -X GET http://localhost:5000/api/googlefit/connect \\`
    );
    console.log(`     -H "Authorization: Bearer ${token}"`);
    console.log("\n💡 Usage in Postman:\n");
    console.log("   1. Go to Headers tab");
    console.log("   2. Add header: Authorization");
    console.log(`   3. Value: Bearer ${token}`);
    console.log("\n━".repeat(80) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error generating token:");
    console.error(`   ${error.message}\n`);
    process.exit(1);
  }
}

// Run the script
main();
