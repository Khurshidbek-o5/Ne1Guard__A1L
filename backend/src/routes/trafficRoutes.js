const express = require('express');
const router = express.Router();
const trafficController = require('../controllers/trafficController');

router.get('/', trafficController.getTraffic);
router.post('/', trafficController.createTraffic);

module.exports = router;
