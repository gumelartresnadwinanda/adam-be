const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
require("dotenv").config(); // For reading environment variables
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
app.use(bodyParser.json()); // Parse incoming JSON data
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
// Use authentication routes
app.use("/auth", authRoutes);
// Use admin routes
app.use("/admin", adminRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
