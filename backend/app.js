const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cron = require("node-cron");
const axios = require("axios"); // Changed from node-fetch to axios

const userRoutes = require("./routes/userRoutes");
const urlRoutes = require("./routes/urlRoutes");
const Url = require("./models/Url");
const cors = require("cors");

const app = express();
dotenv.config();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Use routes
app.use("/api/auth", userRoutes);
app.use("/api/urls", urlRoutes);

// Cron job to check URL status
cron.schedule("*/5 * * * *", async () => {
  console.log("Running cron job to check URLs");
  const urls = await Url.find();

  for (const urlDoc of urls) {
    try {
      const startTime = Date.now();
      const response = await axios.get(urlDoc.url, {
        timeout: 10000, // 10 second timeout
        validateStatus: false, // Don't throw error for non-2xx status codes
      });
      const responseTime = Date.now() - startTime;
      const status =
        response.status >= 200 && response.status < 400 ? "up" : "down";

      // Create new check result
      const checkResult = {
        timestamp: new Date(),
        responseTime: responseTime,
        status: status,
        statusCode: response.status,
      };

      // Update the URL document
      urlDoc.lastChecked = new Date();
      urlDoc.currentStatus = status;
      urlDoc.currentResponseTime = responseTime;

      // Add check result to history array (limiting to most recent 1000 entries)
      urlDoc.history.push(checkResult);
      if (urlDoc.history.length > 1000) {
        urlDoc.history.shift(); // Remove oldest entry if over 1000
      }

      await urlDoc.save();
    } catch (error) {
      // Create new check result with error
      const checkResult = {
        timestamp: new Date(),
        status: "down",
        error: error.message || "Connection failed",
      };

      // Update the URL document
      urlDoc.lastChecked = new Date();
      urlDoc.currentStatus = "down";

      // Add check result to history
      urlDoc.history.push(checkResult);
      if (urlDoc.history.length > 1000) {
        urlDoc.history.shift();
      }

      await urlDoc.save();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
