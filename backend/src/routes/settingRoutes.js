const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Get/Update settings allows both administrator (developer) and IT support roles
router.get('/', protect, requireRole('developer', 'support'), settingController.getSettings);
router.post('/', protect, requireRole('developer', 'support'), settingController.updateSettings);

// Critical Database Clear endpoint is restricted only to administrators (developer role)
router.post('/db/clear', protect, requireRole('developer'), settingController.clearDatabase);

module.exports = router;
