const pool = require("../config/db");

// Helper function to log user activity
async function logActivity(userId, activityType, description) {
  const logQuery = `
    INSERT INTO activity_logs (user_id, activity_type, description)
    VALUES ($1, $2, $3)
  `;
  await pool.query(logQuery, [userId, activityType, description]);
}

module.exports = { logActivity };
