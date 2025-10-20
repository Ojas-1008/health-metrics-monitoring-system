import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Establish connection to MongoDB Atlas
 * Uses connection string from environment variables
 */
const connectDB = async () => {
  try {
    // Connection options for optimal performance and stability
    // Note: useNewUrlParser and useUnifiedTopology are deprecated in MongoDB driver 4.0.0+
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    // Attempt to connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

// Connection event listeners for monitoring
mongoose.connection.on("connected", () => {
  console.log("🟢 Mongoose connected to MongoDB Atlas");
});

mongoose.connection.on("error", (err) => {
  console.error(`🔴 Mongoose connection error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  console.warn("🟡 Mongoose disconnected from MongoDB");
});

// Handle application termination gracefully
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🛑 Mongoose connection closed due to application termination");
  process.exit(0);
});

export default connectDB;