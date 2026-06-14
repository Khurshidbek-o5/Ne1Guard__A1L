const prisma = require('../services/db');

exports.getTraffic = async (req, res) => {
  try {
    const traffic = await prisma.traffic.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    const serializedTraffic = traffic.map(t => ({
      ...t,
      bytes_in: t.bytes_in.toString(),
      bytes_out: t.bytes_out.toString(),
    }));
    res.json(serializedTraffic);
  } catch (error) {
    console.error('Error fetching traffic:', error);
    res.status(500).json({ error: 'Failed to fetch traffic' });
  }
};

exports.createTraffic = async (req, res) => {
  try {
    const { bytes_in, bytes_out, protocol } = req.body;
    const traffic = await prisma.traffic.create({
      data: { 
        bytes_in: BigInt(bytes_in), 
        bytes_out: BigInt(bytes_out), 
        protocol 
      }
    });
    res.status(201).json({
      ...traffic,
      bytes_in: traffic.bytes_in.toString(),
      bytes_out: traffic.bytes_out.toString(),
    });
  } catch (error) {
    console.error('Error storing traffic stats:', error);
    res.status(500).json({ error: 'Failed to store traffic statistics' });
  }
};
