const express = require('express');
const router = express.Router();
const packetController = require('../controllers/packetController');

router.get('/', packetController.getPackets);
router.post('/', packetController.createPacket);

module.exports = router;
