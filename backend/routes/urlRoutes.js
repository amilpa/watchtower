const express = require("express");
const router = express.Router();
const urlController = require("../controllers/urlController");
const authMiddleware = require("../middlewares/authMiddleware");

// Apply auth middleware to all routes
router.use(authMiddleware);

// URL CRUD operations
router.post("/", urlController.addUrl);
router.get("/", urlController.getUrls);
router.get("/:id", urlController.getUrl);
router.patch("/:id", urlController.updateUrl);
router.delete("/:id", urlController.deleteUrl);

// URL statistics and history
router.get("/:id/history", urlController.getUrlHistory);
router.get("/:id/stats", urlController.getUrlStats);

module.exports = router;
