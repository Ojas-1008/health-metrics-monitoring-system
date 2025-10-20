import express from "express";
import { protect, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Public route - should work without token
router.get("/public", (req, res) => {
  res.json({
    success: true,
    message: "This is a public route - no authentication required",
  });
});

// Protected route - requires valid JWT token
router.get("/protected", protect, (req, res) => {
  res.json({
    success: true,
    message: "You have successfully accessed a protected route!",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

// Optional auth route - works with or without token
router.get("/optional", optionalAuth, (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      message: `Welcome back, ${req.user.name}!`,
      authenticated: true,
    });
  } else {
    res.json({
      success: true,
      message: "Welcome, guest user!",
      authenticated: false,
    });
  }
});

export default router;
