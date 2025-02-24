const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 login requests per `window` (here, per 10 minutes)
  message:
    "Too many login attempts from this IP, please try again after 15 minutes",
});

const loginSpeedLimiter = slowDown({
  windowMs: 10 * 60 * 1000, // 10 minutes
  delayAfter: 10, // Allow 10 requests per 10 minutes, then start slowing down responses
  delayMs: () => 500, // Slow down subsequent responses by 500ms per request
});

module.exports = { loginLimiter, loginSpeedLimiter };
