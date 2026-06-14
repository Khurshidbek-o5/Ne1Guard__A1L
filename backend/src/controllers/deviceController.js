const prisma = require('../services/db');

exports.getDevices = async (req, res) => {
  try {
    const devices = await prisma.device.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
};

exports.createDevice = async (req, res) => {
  try {
    const { ip_address, mac_address, hostname, device_type, status, risk_level } = req.body;
    const device = await prisma.device.create({
      data: { ip_address, mac_address, hostname, device_type, status, risk_level }
    });
    res.status(201).json(device);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ error: 'Failed to create device' });
  }
};
