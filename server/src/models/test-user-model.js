import mongoose from "mongoose";
import User from "./User.js";

// ===== MongoDB Connection Options =====
// Option 1: Local MongoDB (if installed)
const MONGODB_URI = "mongodb://localhost:27017/health-metrics-test";

// Option 2: MongoDB Atlas (free cloud database)
// Sign up at https://www.mongodb.com/cloud/atlas
// Then replace with your connection string:
// const MONGODB_URI = "mongodb+srv://<username>:<password>@cluster.mongodb.net/health-metrics?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Connection error:", err));

// Test creating a user
async function testUserModel() {
  try {
    // Create a new user
    const newUser = new User({
      email: "test@example.com",
      password: "password123", // Will be automatically hashed
      name: "Test User",
      goals: {
        stepGoal: 8000,
        sleepGoal: 7,
      },
    });

    // Save to database
    await newUser.save();
    console.log("✅ User created successfully!");
    console.log("User ID:", newUser._id); // MongoDB generated this
    console.log("Password is hashed:", newUser.password); // You'll see the hash

    // Test password comparison
    const isMatch = await newUser.comparePassword("password123");
    console.log("✅ Password match:", isMatch); // Should be true

    const isWrong = await newUser.comparePassword("wrongpassword");
    console.log("❌ Wrong password:", isWrong); // Should be false
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

testUserModel();
