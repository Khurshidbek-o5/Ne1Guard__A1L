const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, requireRole('developer'), settingController.getSettings);
router.post('/', protect, requireRole('developer'), settingController.updateSettings);

module.exports = router;
