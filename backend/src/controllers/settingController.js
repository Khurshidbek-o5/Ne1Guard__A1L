const prisma = require('../services/db');

exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    // Transform array [ { key, value }, ... ] to object { key: value, ... }
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const newSettings = req.body; // Expecting { key: value, key2: value2 }

    const promises = Object.entries(newSettings).map(([key, value]) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    });

    await Promise.all(promises);
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

exports.clearDatabase = async (req, res) => {
  try {
    // Delete historical data in correct order due to foreign key relationships if any
    // Packet has device_id referencing Device, printJob has printerId referencing Device.
    // We clear packets, print jobs, traffic, and alerts.
    
    const [packets, jobs, traffic, alerts] = await prisma.$transaction([
      prisma.packet.deleteMany(),
      prisma.printJob.deleteMany(),
      prisma.traffic.deleteMany(),
      prisma.alert.deleteMany(),
    ]);

    console.log(`🧹 Database cleared: ${packets.count} packets, ${jobs.count} print jobs, ${traffic.count} traffic logs, ${alerts.count} alerts deleted.`);

    // Broadcast update via WebSocket to tell the UI to clear its local display if needed
    if (global.wsBroadcast) {
      global.wsBroadcast({ type: 'DATABASE_CLEARED', timestamp: new Date() });
    }

    res.json({ 
      message: 'Ma\'lumotlar bazasi muvaffaqiyatli tozalandi', 
      stats: {
        packets: packets.count,
        printJobs: jobs.count,
        traffic: traffic.count,
        alerts: alerts.count
      }
    });
  } catch (err) {
    console.error('Error clearing database:', err);
    res.status(500).json({ error: 'Ma\'lumotlar bazasini tozalab bo\'lmadi: ' + err.message });
  }
};
