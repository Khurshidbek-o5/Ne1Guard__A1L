const prisma = require('../services/db');
const { processAlertNotification } = require('../services/notificationService');

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

exports.createAlert = async (req, res) => {
  try {
    const { type, severity, description, source_ip, target_ip, status, risk_score } = req.body;
    const alert = await prisma.alert.create({
      data: { type, severity, description, source_ip, target_ip, status, risk_score: risk_score ? parseInt(risk_score) : null }
    });
    
    if (global.wsBroadcast) {
      global.wsBroadcast({ type: 'NEW_ALERT', payload: alert });
    }
    
    // Trigger Telegram/Email notifications in background
    processAlertNotification(alert).catch(err => console.error('Notification trigger failed:', err));
    
    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
};

exports.updateAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const alert = await prisma.alert.update({
      where: { id: Number(id) },
      data: { status }
    });
    
    if (global.wsBroadcast) {
      global.wsBroadcast({ type: 'UPDATE_ALERT', payload: alert });
    }
    
    res.json(alert);
  } catch (err) {
    console.error('Error updating alert:', err);
    res.status(500).json({ error: 'Failed to update alert status' });
  }
};
