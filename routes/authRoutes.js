const express = require("express");
const {
  register,
  login,
  logout,
  editUser,
  updatePassword,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Route for registering users
router.post("/register", register);

// Route for logging in users
router.post("/login", login);

// Route for logging out users
router.post("/logout", authenticate, logout);

// Route for editing user details
router.put("/edit", authenticate, editUser);

// Route for updating user password
router.put("/update-password", authenticate, updatePassword);

module.exports = router;
