const express = require("express");
const {
  createAdminRequest,
  validateAdminRequest,
  getAdminRequests,
  changeUserToAdmin,
  changeUserToPaid,
  changePaidUserToRegular,
} = require("../controllers/adminController");
const { authenticate, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Route for creating an admin request
router.post("/create-admin-request", createAdminRequest);

// Route for validating an admin request
router.post(
  "/validate-admin-request",
  authenticate,
  isAdmin,
  validateAdminRequest
);

// Route for getting admin requests with pagination
router.get("/admin-requests", authenticate, isAdmin, getAdminRequests);

// Route for changing a user to admin
router.put("/change-to-admin", authenticate, isAdmin, changeUserToAdmin);

// Route for changing a user to paid
router.put("/change-to-paid", authenticate, isAdmin, changeUserToPaid);

// Route for changing a paid user to regular
router.put(
  "/change-to-regular",
  authenticate,
  isAdmin,
  changePaidUserToRegular
);

module.exports = router;
