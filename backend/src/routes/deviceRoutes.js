const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, requireRole('developer'), deviceController.getDevices);
router.post('/', protect, requireRole('developer'), deviceController.createDevice);

module.exports = router;
