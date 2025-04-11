const mongoose = require("mongoose");
const User = require("./models/User");
const Url = require("./models/Url");
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
 * Generate a small number of recent history points
 * @param {number} numPoints Number of data points to generate
 * @param {number} minutesBetweenChecks Minutes between each check
 * @returns {Array} Array of check results
 */
function generateRecentHistory(numPoints, minutesBetweenChecks = 30) {
  const now = new Date();
  const history = [];

  // Generate a small number of entries at regular intervals
  for (let i = 0; i < numPoints; i++) {
    // Go back i checks
    const timestamp = new Date(now - i * minutesBetweenChecks * 60 * 1000);

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
 * Create a demo user with two sample URLs and minimal recent monitoring history
 */
async function seedSampleData() {
  try {
    // Clear existing data
    console.log("Clearing existing sample data...");
    await User.deleteOne({ email: "demo@example.com" });

    // Create demo user with a password that meets the validation requirements
    console.log("Creating demo user...");
    const validPassword = "amil1234"; // Make sure this meets your password requirements

    const demoUser = new User({
      name: "Demo User",
      email: "demo@example.com",
      password: validPassword,
    });

    const savedUser = await demoUser.save();
    console.log("Demo user created successfully!");

    // Just two sample websites to monitor
    const websites = [
      { url: "https://example.com", name: "Example Website" },
      { url: "https://github.com", name: "GitHub" },
    ];

    // Delete any existing URLs for this user
    await Url.deleteMany({ user: savedUser._id });

    // Create sample URLs with history - fewer data points at shorter intervals
    console.log("Creating sample URL monitoring data...");

    // Generate 8 points with 30-minute intervals for the first site (covers last 4 hours)
    const exampleHistory = generateRecentHistory(8, 30);

    // Generate 6 points with 20-minute intervals for the second site (covers last 2 hours)
    const githubHistory = generateRecentHistory(6, 20);

    // Create the first URL
    const mostRecentExample = exampleHistory[0];
    const exampleUrl = new Url({
      url: websites[0].url,
      name: websites[0].name,
      user: savedUser._id,
      checkInterval: 30,
      lastChecked: new Date(),
      currentStatus: mostRecentExample.status,
      currentResponseTime: mostRecentExample.responseTime,
      history: exampleHistory.reverse(), // Newest first in the array
    });
    await exampleUrl.save();
    console.log(
      `Created URL 1/2: ${websites[0].name} (${exampleHistory.length} data points)`
    );

    // Create the second URL
    const mostRecentGithub = githubHistory[0];
    const githubUrl = new Url({
      url: websites[1].url,
      name: websites[1].name,
      user: savedUser._id,
      checkInterval: 20,
      lastChecked: new Date(),
      currentStatus: mostRecentGithub.status,
      currentResponseTime: mostRecentGithub.responseTime,
      history: githubHistory.reverse(), // Newest first in the array
    });
    await githubUrl.save();
    console.log(
      `Created URL 2/2: ${websites[1].name} (${githubHistory.length} data points)`
    );

    // Detailed time information for verification
    const oldestExampleTime = new Date(
      exampleHistory[exampleHistory.length - 1].timestamp
    );
    const oldestGithubTime = new Date(
      githubHistory[githubHistory.length - 1].timestamp
    );

    console.log("\nSample data seeded successfully!");
    console.log("Demo account:");
    console.log("  Email: demo@example.com");
    console.log("  Password: amil1234");

    // Print some stats about the data
    console.log("\nData Summary:");
    console.log(
      `Example Website: ${exampleHistory.length} checks over ${
        (8 * 30) / 60
      } hours (30-minute intervals)`
    );
    console.log(`  Oldest check: ${oldestExampleTime.toLocaleString()}`);
    console.log(`  Newest check: ${new Date().toLocaleString()}`);

    console.log(
      `GitHub: ${githubHistory.length} checks over ${
        (6 * 20) / 60
      } hours (20-minute intervals)`
    );
    console.log(`  Oldest check: ${oldestGithubTime.toLocaleString()}`);
    console.log(`  Newest check: ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

// Execute the seeding function
seedSampleData();
