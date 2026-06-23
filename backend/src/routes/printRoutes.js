const express = require('express');
const router = express.Router();
const printController = require('../controllers/printController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// All print routes require 'printer' or 'developer' role
router.get('/printers', protect, requireRole('developer', 'printer'), printController.getPrinters);
router.get('/queue', protect, requireRole('developer', 'printer'), printController.getQueue);
router.post('/jobs', protect, requireRole('developer', 'printer'), printController.createJob);
router.post('/jobs/:id/cancel', protect, requireRole('developer', 'printer'), printController.cancelJob);
router.post('/jobs/:id/retry', protect, requireRole('developer', 'printer'), printController.retryJob);
router.post('/printers/:id/refill', protect, requireRole('developer', 'printer'), printController.refillToner);
router.post('/printers/:id/toggle-status', protect, requireRole('developer', 'printer'), printController.toggleStatus);
router.post('/printers/:id/fix', protect, requireRole('developer', 'printer'), printController.fixPrinter);

module.exports = router;
