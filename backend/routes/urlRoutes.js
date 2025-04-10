const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware.authenticateToken, urlController.addUrl);

module.exports = router;
