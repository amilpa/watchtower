const Url = require("../models/Url");
const axios = require("axios");

/**
 * Create a new URL for monitoring
 */
exports.addUrl = async (req, res) => {
  try {
    const { url, name, checkInterval } = req.body;

    // Create new URL document with reference to current user
    const newUrl = new Url({
      url,
      name: name || url.split("/")[2],
      user: req.user.userId,
      checkInterval: checkInterval || 5,
      currentStatus: "unknown",
    });

    // Immediately check the status of the URL
    try {
      const startTime = Date.now();
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: false,
      });
      const responseTime = Date.now() - startTime;
      const status =
        response.status >= 200 && response.status < 400 ? "up" : "down";

      // Create initial check result
      const checkResult = {
        timestamp: new Date(),
        responseTime: responseTime,
        status: status,
        statusCode: response.status,
      };

      // Update the URL document
      newUrl.lastChecked = new Date();
      newUrl.currentStatus = status;
      newUrl.currentResponseTime = responseTime;
      newUrl.history.push(checkResult);
    } catch (error) {
      // Create initial check result with error
      const checkResult = {
        timestamp: new Date(),
        status: "down",
        error: error.message || "Connection failed",
      };

      // Update the URL document
      newUrl.lastChecked = new Date();
      newUrl.currentStatus = "down";
      newUrl.history.push(checkResult);
    }

    // Save the URL document with the initial check result
    await newUrl.save();
    res.status(201).json(newUrl);
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You are already monitoring this URL",
      });
    }
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get all URLs for the current user
 */
exports.getUrls = async (req, res) => {
  try {
    const urls = await Url.find({ user: req.user.userId });
    res.status(200).json(urls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a specific URL by ID
 */
exports.getUrl = async (req, res) => {
  try {
    const url = await Url.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    res.status(200).json(url);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update a URL
 */
exports.updateUrl = async (req, res) => {
  try {
    const { name, checkInterval } = req.body;
    const allowedUpdates = {};

    if (name) allowedUpdates.name = name;
    if (checkInterval) allowedUpdates.checkInterval = checkInterval;

    const url = await Url.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      allowedUpdates,
      { new: true, runValidators: true }
    );

    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    res.status(200).json(url);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Delete a URL
 */
exports.deleteUrl = async (req, res) => {
  try {
    const url = await Url.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    res.status(200).json({ message: "URL deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get URL status history
 */
exports.getUrlHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100, page = 1 } = req.query;

    const url = await Url.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    // Get a slice of the history array
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedHistory = url.history.slice(startIndex, endIndex);

    res.status(200).json({
      _id: url._id,
      url: url.url,
      name: url.name,
      currentStatus: url.currentStatus,
      lastChecked: url.lastChecked,
      currentResponseTime: url.currentResponseTime,
      history: paginatedHistory,
      totalRecords: url.history.length,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get uptime statistics for a URL
 */
exports.getUrlStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = "24h" } = req.query;

    const url = await Url.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    // Calculate the start time based on the period
    let startTime = new Date();
    switch (period) {
      case "24h":
        startTime.setHours(startTime.getHours() - 24);
        break;
      case "7d":
        startTime.setDate(startTime.getDate() - 7);
        break;
      case "30d":
        startTime.setDate(startTime.getDate() - 30);
        break;
      default:
        startTime.setHours(startTime.getHours() - 24);
    }

    // Filter history by time period
    const filteredHistory = url.history.filter(
      (item) => new Date(item.timestamp) >= startTime
    );

    // Calculate statistics
    const totalChecks = filteredHistory.length;
    const upChecks = filteredHistory.filter(
      (item) => item.status === "up"
    ).length;
    const avgResponseTime =
      filteredHistory.reduce((sum, item) => sum + (item.responseTime || 0), 0) /
      (totalChecks || 1);

    // Calculate uptime percentage
    const uptimePercentage = totalChecks ? (upChecks / totalChecks) * 100 : 0;

    res.status(200).json({
      _id: url._id,
      url: url.url,
      name: url.name,
      period,
      uptimePercentage: uptimePercentage.toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
      totalChecks,
      upChecks,
      downChecks: totalChecks - upChecks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Test a URL immediately and record the results
 */
exports.testUrl = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the URL in the database
    const url = await Url.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    // Test the URL immediately
    try {
      const startTime = Date.now();
      const response = await axios.get(url.url, {
        timeout: 10000,
        validateStatus: false, // Don't throw on HTTP error status codes
      });
      const responseTime = Date.now() - startTime;
      const status =
        response.status >= 200 && response.status < 400 ? "up" : "down";

      // Create check result
      const checkResult = {
        timestamp: new Date(),
        responseTime: responseTime,
        status: status,
        statusCode: response.status,
        manual: true, // Flag that this was a manual test
      };

      // Update the URL document with the new check
      url.lastChecked = new Date();
      url.currentStatus = status;
      url.currentResponseTime = responseTime;

      // Add to history, maintaining the limit of entries
      url.history.push(checkResult);
      if (url.history.length > 100) {
        url.history = url.history.slice(-100); // Keep only the last 100 entries
      }

      await url.save();

      return res.status(200).json({
        success: true,
        status: status,
        responseTime: responseTime,
        statusCode: response.status,
        url: url.url,
        timestamp: new Date(),
      });
    } catch (error) {
      // Create check result with error
      const checkResult = {
        timestamp: new Date(),
        status: "down",
        error: error.message || "Connection failed",
        manual: true, // Flag that this was a manual test
      };

      // Update URL document with failure information
      url.lastChecked = new Date();
      url.currentStatus = "down";
      url.currentResponseTime = null;

      // Add to history, maintaining the limit of entries
      url.history.push(checkResult);
      if (url.history.length > 100) {
        url.history = url.history.slice(-100); // Keep only the last 100 entries
      }

      await url.save();

      return res.status(200).json({
        success: false,
        status: "down",
        error: error.message || "Connection failed",
        url: url.url,
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error("Error testing URL:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
