const mongoose = require("mongoose");
const User = require("./models/User");
const Url = require("./models/Url");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/watchtower")
  .then(() => console.log("MongoDB connected for seeding"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/**
 * Generate random response times with occasional spikes
 * @returns {number} Response time in milliseconds
 */
function generateRandomResponseTime() {
  // Base response time between 150-300ms
  const base = Math.floor(Math.random() * 150) + 150;

  // 10% chance of a spike
  if (Math.random() < 0.1) {
    // Spike between 500-2000ms
    return base + Math.floor(Math.random() * 1500) + 500;
  }

  return base;
}

/**
 * Generate random status with occasional downtime
 * @returns {Object} Status object with status and optional error
 */
function generateRandomStatus() {
  // 5% chance of being down
  if (Math.random() < 0.05) {
    const errors = [
      "Connection timeout",
      "DNS resolution failed",
      "Server returned 500 error",
      "SSL certificate validation failed",
      "Connection refused",
    ];
    const randomError = errors[Math.floor(Math.random() * errors.length)];
    return { status: "down", error: randomError };
  }

  return {
    status: "up",
    statusCode: 200,
  };
}

/**
 * Generate sample history data for the specified number of days
 * @param {number} days Number of days of history to generate
 * @returns {Array} Array of check results
 */
function generateSampleHistory(days) {
  const now = new Date();
  const history = [];

  // Generate one entry roughly every hour for the specified number of days
  for (let i = 0; i < days * 24; i++) {
    const timestamp = new Date(now - i * 60 * 60 * 1000); // Go back i hours

    // Get random status
    const statusInfo = generateRandomStatus();

    // Create check result object
    const checkResult = {
      timestamp,
      status: statusInfo.status,
      ...(statusInfo.status === "up"
        ? {
            responseTime: generateRandomResponseTime(),
            statusCode: statusInfo.statusCode,
          }
        : { error: statusInfo.error }),
    };

    history.push(checkResult);
  }

  return history;
}

/**
 * Create a demo user and sample URLs with monitoring history
 */
async function seedSampleData() {
  try {
    // Clear existing data
    console.log("Clearing existing sample data...");
    await User.deleteOne({ email: "demo@example.com" });

    // Create demo user with a password that meets the validation requirements
    console.log("Creating demo user...");

    // Password with at least 8 characters, letters, and numbers
    const validPassword = "amil1234";

    const demoUser = new User({
      name: "Demo User",
      email: "demo@example.com",
      password: validPassword,
    });

    const savedUser = await demoUser.save();
    console.log("Demo user created successfully!");

    // Sample websites to monitor
    const websites = [
      { url: "https://example.com", name: "Example Website" },
      { url: "https://google.com", name: "Google" },
      { url: "https://github.com", name: "GitHub" },
      { url: "https://stackoverflow.com", name: "Stack Overflow" },
      { url: "https://reactjs.org", name: "React Docs" },
    ];

    // Delete any existing URLs for this user
    await Url.deleteMany({ user: savedUser._id });

    // Create sample URLs with history
    console.log("Creating sample URL monitoring data...");
    let urlsCreated = 0;

    for (const site of websites) {
      // Generate 30 days of sample history
      const history = generateSampleHistory(30);

      // Get the most recent status info for currentStatus
      const mostRecent = history[0];

      const newUrl = new Url({
        url: site.url,
        name: site.name,
        user: savedUser._id,
        checkInterval: Math.floor(Math.random() * 5) + 1, // Random interval between 1-5 minutes
        lastChecked: new Date(),
        currentStatus: mostRecent.status,
        currentResponseTime: mostRecent.responseTime,
        history: history.reverse(), // Newest first in the array
      });

      await newUrl.save();
      urlsCreated++;
      console.log(
        `Created URL ${urlsCreated}/${websites.length}: ${site.name}`
      );
    }

    console.log("Sample data seeded successfully!");
    console.log("Demo account:");
    console.log("  Email: demo@example.com");
    console.log("  Password: DemoPass123");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

// Execute the seeding function
seedSampleData();
