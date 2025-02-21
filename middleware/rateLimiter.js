const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 5 login requests per `window` (here, per 15 minutes)
  message:
    "Too many login attempts from this IP, please try again after 15 minutes",
});

const loginSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // Allow 5 requests per 15 minutes, then start slowing down responses
  delayMs: () => 500, // Slow down subsequent responses by 500ms per request
});

module.exports = { loginLimiter, loginSpeedLimiter };
