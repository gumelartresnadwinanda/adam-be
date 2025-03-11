const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
require("dotenv").config(); // For reading environment variables
const cors = require("cors");
const cookieParser = require("cookie-parser");
const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [];
const app = express();
app.use(bodyParser.json()); // Parse incoming JSON data
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
// Use authentication routes
app.use("/auth", authRoutes);
// Use admin routes
app.use("/admin", adminRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
