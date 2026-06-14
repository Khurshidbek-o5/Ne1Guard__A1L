const prisma = require('../services/db');
const alertService = require('../services/alertService');

exports.getPackets = async (req, res) => {
  try {
    const packets = await prisma.packet.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.json(packets);
  } catch (error) {
    console.error('Error fetching packets:', error);
    res.status(500).json({ error: 'Failed to fetch packets' });
  }
};

exports.createPacket = async (req, res) => {
  try {
    const { source_ip, destination_ip, port, protocol, size, status, device_id } = req.body;
    
    const packet = await prisma.packet.create({
      data: { 
        source_ip, 
        destination_ip, 
        port: port ? parseInt(port) : null,
        protocol, 
        size: parseInt(size),
        status,
        device_id 
      }
    });
    
    // Analyze for alerts
    alertService.analyzePacket(packet).catch(err => console.error('Alert Analysis Error:', err));
    
    res.status(201).json(packet);
  } catch (error) {
    console.error('Error saving packet:', error);
    res.status(500).json({ error: 'Failed to save packet' });
  }
};
