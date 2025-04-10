const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  url: String,
  lastChecked: Date,
  responseTime: Number,
  status: String,
});

module.exports = mongoose.model('Url', urlSchema);
