const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { logActivity } = require("./activityLogger");

// Register new user
async function register(req, res) {
  const { username, email, full_name, password } = req.body;

  // Validate username
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({
      error:
        "Username contains invalid characters. Only letters, numbers, and underscores are allowed.",
    });
  }

  // Validate password length
  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long.",
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

    // Insert user into the database
    const insertQuery = `
            INSERT INTO users (username, email, full_name, password_hash)
            VALUES ($1, $2, $3, $4) RETURNING id, username, email
        `;
    const insertResult = await pool.query(insertQuery, [
      username,
      email,
      full_name,
      hashedPassword,
    ]);
    const newUser = insertResult.rows[0];

    // Log activity
    await logActivity(newUser.id, "register", "User registered");

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (err) {
    console.error("Error in registration:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Login user
async function login(req, res) {
  const { email, password } = req.body;

  try {
    // Find user by email
    const userQuery =
      "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL";
    const { rows } = await pool.query(userQuery, [email]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await logActivity(user.id, "login_failed", "Invalid credentials");
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        username: user.username,
        email: user.username,
        full_name: user.full_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set the token in a cookie
    res.cookie(process.env.COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 72 * 60 * 60 * 1000, // 3 day
      domain: process.env.COOKIE_DOMAIN,
      sameSite: "lax",
    });

    // Log activity
    await logActivity(user.id, "login", "User logged in");

    res.json({
      accessToken,
      user,
    });
  } catch (err) {
    console.error("Error in login:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Logout user
async function logout(req, res) {
  const { userId } = req.user;
  res.clearCookie(process.env.COOKIE_NAME);
  await logActivity(userId, "logout", "User logged out");
  res.status(200).json({ message: "Logged out successfully" });
}

// Edit user details
async function editUser(req, res) {
  const { userId } = req.user;
  const {
    username,
    email,
    full_name,
    date_of_birth,
    profile_picture,
    phone_number,
    address,
    timezone,
    language_preference,
  } = req.body;

  try {
    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (username && !usernameRegex.test(username)) {
      return res.status(400).json({
        error:
          "Username contains invalid characters. Only letters, numbers, and underscores are allowed.",
      });
    }

    // Prepare the update query and values
    const updateFields = [
      username,
      email,
      full_name,
      date_of_birth || null,
      profile_picture,
      phone_number,
      address,
      timezone,
      language_preference,
    ];
    const updateQuery = `
      UPDATE users
      SET username = COALESCE($1, username),
          email = COALESCE($2, email),
          full_name = COALESCE($3, full_name),
          date_of_birth = COALESCE(NULLIF($4, '')::date, date_of_birth),
          profile_picture = COALESCE($5, profile_picture),
          phone_number = COALESCE($6, phone_number),
          address = COALESCE($7, address),
          timezone = COALESCE($8, timezone),
          language_preference = COALESCE($9, language_preference),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 AND deleted_at IS NULL
      RETURNING id, username, email, full_name, date_of_birth, profile_picture, phone_number, address, timezone, language_preference
    `;
    const { rows } = await pool.query(updateQuery, [...updateFields, userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = rows[0];

    // Log activity
    await logActivity(userId, "profile_update", "User updated profile");

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error in updating user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Update user password
async function updatePassword(req, res) {
  const { userId } = req.user;
  const { oldPassword, newPassword } = req.body;

  // Validate new password length
  if (newPassword.length < 8) {
    return res.status(400).json({
      error: "New password must be at least 8 characters long.",
    });
  }

  try {
    // Find user by ID
    const userQuery =
      "SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL";
    const { rows } = await pool.query(userQuery, [userId]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in the database
    const updatePasswordQuery = `
      UPDATE users
      SET password_hash = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND deleted_at IS NULL
    `;
    await pool.query(updatePasswordQuery, [hashedPassword, userId]);

    // Log activity
    await logActivity(userId, "password_change", "User changed password");

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error in updating password:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Delete user (soft delete)
async function deleteUser(req, res) {
  const { userId } = req.user;

  try {
    // Soft delete user from the database
    const deleteQuery = `
      UPDATE users
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;
    const { rows } = await pool.query(deleteQuery, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log activity
    await logActivity(userId, "delete", "User account deleted");

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error in deleting user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Get current user details
async function getCurrentUser(req, res) {
  const { userId } = req.user;

  try {
    // Find user by ID
    const userQuery =
      "SELECT id, username, email, full_name, role FROM users WHERE id = $1 AND deleted_at IS NULL";
    const { rows } = await pool.query(userQuery, [userId]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("Error in getting current user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  register,
  login,
  logout,
  editUser,
  updatePassword,
  deleteUser,
  getCurrentUser,
};
