const mongoose = require("mongoose");

// Schema for individual check results
const checkResultSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    responseTime: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["up", "down"],
      required: true,
    },
    statusCode: {
      type: Number,
    },
    error: {
      type: String,
    },
  },
  { _id: false }
);

// Main URL schema
const urlSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "URL is required"],
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastChecked: {
      type: Date,
    },
    currentStatus: {
      type: String,
      enum: ["up", "down", "unknown"],
      default: "unknown",
    },
    currentResponseTime: {
      type: Number,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    checkInterval: {
      type: Number,
      default: 5, // Default 5 minutes
      min: 1,
    },
    history: [checkResultSchema],
  },
  { timestamps: true }
);

// Index for efficient querying
urlSchema.index({ user: 1, url: 1 }, { unique: true });

module.exports = mongoose.model("Url", urlSchema);
