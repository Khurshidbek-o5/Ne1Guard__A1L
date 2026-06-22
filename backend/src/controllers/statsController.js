const prisma = require('../services/db');
const { calculateThreatScore, getTrackerStats } = require('../services/alertService');

/* GET /api/stats — System-wide statistics */
exports.getStats = async (req, res) => {
  try {
    const oneHour  = new Date(Date.now() - 60 * 60 * 1000);
    const oneDay   = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalPackets, attackPackets, suspiciousPackets,
      totalAlerts, activeAlerts, criticalAlerts,
      totalDevices, onlineDevices,
      totalTraffic,
      recentPackets,
      alertsByType,
      threatScore,
    ] = await Promise.all([
      prisma.packet.count(),
      prisma.packet.count({ where: { status: 'attack' } }),
      prisma.packet.count({ where: { status: 'suspicious' } }),
      prisma.alert.count(),
      prisma.alert.count({ where: { status: 'active' } }),
      prisma.alert.count({ where: { severity: 'critical', status: 'active' } }),
      prisma.device.count(),
      prisma.device.count({ where: { status: 'online' } }),
      prisma.traffic.count(),
      // Last 24h packets per hour
      prisma.packet.findMany({
        where: { timestamp: { gte: oneDay } },
        select: { timestamp: true, status: true, protocol: true, source_ip: true },
        orderBy: { timestamp: 'asc' },
        take: 5000,
      }),
      // Alert type distribution
      prisma.alert.groupBy({ by: ['type'], _count: { id: true } }),
      calculateThreatScore(),
    ]);

    // Build hourly traffic data for last 24h
    const hourlyData = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(Date.now() - i * 60 * 60 * 1000);
      const label = `${hour.getHours().toString().padStart(2, '0')}:00`;
      const hourPackets = recentPackets.filter(p => {
        const ph = new Date(p.timestamp).getHours();
        return ph === hour.getHours();
      });
      hourlyData.push({
        time: label,
        normal:     hourPackets.filter(p => p.status === 'normal').length,
        suspicious: hourPackets.filter(p => p.status === 'suspicious').length,
        attack:     hourPackets.filter(p => p.status === 'attack').length,
        total:      hourPackets.length,
      });
    }

    // Protocol distribution
    const protocolCounts = {};
    recentPackets.forEach(p => {
      protocolCounts[p.protocol] = (protocolCounts[p.protocol] || 0) + 1;
    });
    const protocolData = Object.entries(protocolCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // Top threat IPs
    const attackIps = {};
    if (Array.isArray(recentPackets)) {
      recentPackets.filter(p => p.status === 'attack' || p.status === 'suspicious').forEach(p => {
        if (p.source_ip) {
          attackIps[p.source_ip] = (attackIps[p.source_ip] || 0) + 1;
        }
      });
    }
    const threatIpsData = Object.entries(attackIps)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));

    res.json({
      overview: {
        threat_score:      threatScore,
        total_packets:     totalPackets,
        attack_packets:    attackPackets,
        suspicious_packets:suspiciousPackets,
        total_alerts:      totalAlerts,
        active_alerts:     activeAlerts,
        critical_alerts:   criticalAlerts,
        total_devices:     totalDevices,
        online_devices:    onlineDevices,
        total_traffic:     totalTraffic,
      },
      tracker_stats: getTrackerStats(),
      hourly_traffic: hourlyData,
      protocol_distribution: protocolData,
      top_threat_ips: threatIpsData,
      alert_types: alertsByType.map(a => ({ type: a.type, count: a._count.id })),
    });
  } catch (err) {
    console.error('[Stats]', err);
    res.status(500).json({ error: err.message });
  }
};
