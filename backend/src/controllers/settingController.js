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
