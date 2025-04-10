const Url = require('../models/Url');

exports.addUrl = async (req, res) => {
  const { url } = req.body;
  const newUrl = new Url({ url, lastChecked: new Date(), responseTime: 0, status: 'unknown' });
  try {
    await newUrl.save();
    res.status(201).json(newUrl);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
