import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../.env") });

const User = mongoose.model(
  "User",
  new mongoose.Schema({}, { strict: false }),
  "users"
);

async function checkScope() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const user = await User.findOne(
      { email: "ojasshrivastava1008@gmail.com" },
      { "googleFitTokens.scope": 1 }
    );

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("\n📋 Current Scope in DB:");
    console.log(user.googleFitTokens?.scope);
    console.log("\n📋 Expected Scope (from error message):");
    console.log("https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.nutrition.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.location.read");

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkScope();
