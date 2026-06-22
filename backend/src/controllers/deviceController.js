const prisma = require('../services/db');

exports.getDevices = async (req, res) => {
  try {
    let devices = await prisma.device.findMany({
      orderBy: { created_at: 'desc' }
    });

    // If no devices exist, seed some standard devices for a premium SOC dashboard experience
    if (devices.length === 0) {
      await prisma.device.createMany({
        data: [
          { ip_address: '192.168.1.1', hostname: 'Core-Router', device_type: 'router', status: 'online', risk_level: 'safe' },
          { ip_address: '192.168.1.10', hostname: 'SOC-Server-01', device_type: 'server', status: 'online', risk_level: 'safe' },
          { ip_address: '192.168.1.20', hostname: 'Workstation-Manager', device_type: 'workstation', status: 'online', risk_level: 'safe' },
          { ip_address: '192.168.1.50', hostname: 'IP-Camera-Entrance', device_type: 'iot', status: 'online', risk_level: 'low' },
          { ip_address: '192.168.1.150', hostname: 'Staff-Laptop-1', device_type: 'workstation', status: 'offline', risk_level: 'safe' },
          { ip_address: '192.168.1.101', hostname: 'HP-LASERJET-D8', device_type: 'printer', modelName: 'HP LaserJet Pro M404n', tonerLevel: 78, pageCount: 12450, status: 'online', risk_level: 'safe' },
          { ip_address: '192.168.1.102', hostname: 'EPSON-L3150-NET', device_type: 'printer', modelName: 'Epson EcoTank L3150', tonerLevel: 42, pageCount: 5200, status: 'online', risk_level: 'safe' },
          { ip_address: '192.168.1.105', hostname: 'CANON-MF237W', device_type: 'printer', modelName: 'Canon imageCLASS MF237w', tonerLevel: 12, pageCount: 28400, status: 'online', risk_level: 'warning' },
        ]
      });
      devices = await prisma.device.findMany({
        orderBy: { created_at: 'desc' }
      });
    }

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
