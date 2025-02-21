const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { logActivity } = require("./activityLogger");

// Create admin request
async function createAdminRequest(req, res) {
  const { username, email, full_name, password } = req.body;

  // Validate username
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({
      error:
        "Username contains invalid characters. Only letters, numbers, and underscores are allowed.",
    });
  }

  try {
    // Check if the user already exists
    const userCheckQuery =
      "SELECT * FROM users WHERE (email = $1 OR username = $2) AND deleted_at IS NULL";
    const { rows } = await pool.query(userCheckQuery, [email, username]);
    if (rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin request into the database
    const insertQuery = `
      INSERT INTO admin_requests (username, email, full_name, password_hash)
      VALUES ($1, $2, $3, $4) RETURNING id, username, email
    `;
    const insertResult = await pool.query(insertQuery, [
      username,
      email,
      full_name,
      hashedPassword,
    ]);
    const newAdminRequest = insertResult.rows[0];

    res.status(201).json({
      message: "Admin request created successfully",
      adminRequest: newAdminRequest,
    });
  } catch (err) {
    console.error("Error in creating admin request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Validate admin request
async function validateAdminRequest(req, res) {
  const { requestId, isValid } = req.body;

  try {
    // Find admin request by ID
    const requestQuery =
      "SELECT * FROM admin_requests WHERE id = $1 AND is_validated = false";
    const { rows } = await pool.query(requestQuery, [requestId]);
    const adminRequest = rows[0];

    if (!adminRequest) {
      return res.status(404).json({ error: "Admin request not found" });
    }

    if (isValid) {
      // Insert admin user into the users table
      const insertUserQuery = `
        INSERT INTO users (id, username, email, full_name, password_hash, role)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'admin') RETURNING id, username, email, role
      `;
      const insertUserResult = await pool.query(insertUserQuery, [
        adminRequest.username,
        adminRequest.email,
        adminRequest.full_name,
        adminRequest.password_hash,
      ]);
      const newUser = insertUserResult.rows[0];

      // Log activity
      await logActivity(newUser.id, "create_admin", "Admin user created");
      const updateRequestQuery = `
        UPDATE admin_requests
        SET is_validated = true
        WHERE id = $1
      `;
      await pool.query(updateRequestQuery, [requestId]);
      res.status(201).json({
        message: "Admin user created successfully",
        user: newUser,
      });
    } else {
      // Soft delete the admin request
      const deleteRequestQuery = `
        UPDATE admin_requests
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await pool.query(deleteRequestQuery, [requestId]);

      res.status(200).json({ message: "Admin request deleted successfully" });
    }
  } catch (err) {
    console.error("Error in validating admin request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Get list of admin requests with pagination
async function getAdminRequests(req, res) {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const query = `
      SELECT * FROM admin_requests
      WHERE deleted_at IS NULL
      AND is_validated = false 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await pool.query(query, [limit, offset]);

    res.status(200).json({
      message: "Admin requests retrieved successfully",
      adminRequests: rows,
    });
  } catch (err) {
    console.error("Error in retrieving admin requests:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Change user role to admin
async function changeUserToAdmin(req, res) {
  const { userId } = req.body;

  try {
    // Update user role to admin
    const updateQuery = `
      UPDATE users
      SET role = 'admin',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, username, email, role
    `;
    const { rows } = await pool.query(updateQuery, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = rows[0];

    // Log activity
    await logActivity(userId, "change_role", "User role changed to admin");

    res.status(200).json({
      message: "User role changed to admin successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error in changing user role to admin:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Change user role to paid
async function changeUserToPaid(req, res) {
  const { userId } = req.body;

  try {
    // Update user role to paid
    const updateQuery = `
      UPDATE users
      SET role = 'paid',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, username, email, role
    `;
    const { rows } = await pool.query(updateQuery, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = rows[0];

    // Log activity
    await logActivity(userId, "change_role", "User role changed to paid");

    res.status(200).json({
      message: "User role changed to paid successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error in changing user role to paid:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Change paid user to regular
async function changePaidUserToRegular(req, res) {
  const { userId } = req.body;

  try {
    // Update user role to regular
    const updateQuery = `
      UPDATE users
      SET role = 'regular',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, username, email, role
    `;
    const { rows } = await pool.query(updateQuery, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = rows[0];

    // Log activity
    await logActivity(userId, "change_role", "User role changed to regular");

    res.status(200).json({
      message: "User role changed to regular successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error in changing user role to regular:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  createAdminRequest,
  validateAdminRequest,
  getAdminRequests,
  changeUserToAdmin,
  changeUserToPaid,
  changePaidUserToRegular,
};
