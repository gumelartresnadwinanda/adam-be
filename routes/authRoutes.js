const express = require("express");
const {
  register,
  login,
  logout,
  editUser,
  updatePassword,
  getCurrentUser,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  loginLimiter,
  loginSpeedLimiter,
} = require("../middleware/rateLimiter");

const router = express.Router();

// Route for registering users
router.post("/register", register);

// Route for logging in users with rate limiting
router.post("/login", loginLimiter, loginSpeedLimiter, login);

// Route for logging out users
router.post("/logout", authenticate, logout);

// Route for editing user details
router.put("/edit", authenticate, editUser);

// Route for updating user password
router.put("/update-password", authenticate, updatePassword);

// Route for getting current user details
router.get("/me", authenticate, getCurrentUser);

module.exports = router;
