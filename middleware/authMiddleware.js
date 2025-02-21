const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticate = (req, res, next) => {
  const cookieName = process.env.COOKIE_NAME;
  const tokenFromCookie = req.cookies?.[cookieName];
  const token = req.headers.authorization?.split(" ")[1] || tokenFromCookie;
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

module.exports = { authenticate, isAdmin };
