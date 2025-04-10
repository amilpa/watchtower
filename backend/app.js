const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cron = require('node-cron');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const userRoutes = require('./routes/userRoutes');
const urlRoutes = require('./routes/urlRoutes');
const Url = require('./models/Url');

const app = express();
dotenv.config();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/urls', urlRoutes);

// Cron job to check URL status
cron.schedule('*/5 * * * *', async () => {
  console.log('Running cron job to check URLs');
  const urls = await Url.find();
  urls.forEach(async (urlDoc) => {
    try {
      const startTime = Date.now();
      const response = await fetch(urlDoc.url);
      const responseTime = Date.now() - startTime;
      urlDoc.responseTime = responseTime;
      urlDoc.status = response.ok ? 'up' : 'down';
      urlDoc.lastChecked = new Date();
      await urlDoc.save();
    } catch (error) {
      urlDoc.status = 'down';
      urlDoc.lastChecked = new Date();
      await urlDoc.save();
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
