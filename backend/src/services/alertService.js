const prisma = require('./db');
const { processAlertNotification } = require('./notificationService');

/* ═══════════════════════════════════════════════════
   NetGuard AI — Advanced Detection Engine
   Detects: Brute Force, Port Scan, ARP Spoof,
            Data Exfiltration, Insecure Protocols,
            DDoS patterns
═══════════════════════════════════════════════════ */

// In-memory trackers (resets on restart — production: use Redis)
const portScanTracker  = new Map(); // ip → { ports: Set, firstSeen: Date }
const bruteForceTracker = new Map(); // ip → { count, firstSeen }
const arpTracker        = new Map(); // ip → mac
const ddosTracker       = new Map(); // ip → { count, firstSeen }
const recentAlerts      = new Set(); // deduplication key set
const trackerCleanupTimes = new Map(); // tracker Map ref -> lastCleanupTime

const WINDOW_MS     = 60 * 1000;   // 1 minute window
const PORT_SCAN_THR = 8;           // ports per minute → port scan
const BRUTE_THR     = 10;          // attempts per minute → brute force
const DDOS_THR      = 50;          // packets per minute → DDoS

/* ── Helper: create alert with dedup ── */
async function createAlert(data, dedupKey) {
  if (dedupKey && recentAlerts.has(dedupKey)) return null;
  if (dedupKey) {
    recentAlerts.add(dedupKey);
    setTimeout(() => recentAlerts.delete(dedupKey), 5 * 60 * 1000); // 5 min
  }
  try {
    const alert = await prisma.alert.create({ data });
    // Broadcast via WebSocket if available
    if (global.wsBroadcast) {
      global.wsBroadcast({ type: 'NEW_ALERT', payload: alert });
    }
    
    // Trigger Telegram/Email notifications in background
    processAlertNotification(alert).catch(err => console.error('[Detection] Notification trigger failed:', err));
    
    return alert;
  } catch (err) {
    console.error('[Detection] Failed to create alert:', err.message);
    return null;
  }
}

/* ── Helper: cleanup expired entries ── */
function cleanOldEntries(tracker, windowMs) {
  const now = Date.now();
  const lastCleanup = trackerCleanupTimes.get(tracker) || 0;
  // Throttle cleanup per tracker to once every 5 seconds
  if (now - lastCleanup < 5000) return;
  
  for (const [key, val] of tracker.entries()) {
    if (now - val.firstSeen > windowMs) tracker.delete(key);
  }
  trackerCleanupTimes.set(tracker, now);
}

/* ═══════════════════════════════════════════
   MAIN ANALYSIS FUNCTION
═══════════════════════════════════════════ */
exports.analyzePacket = async (packetData) => {
  const { source_ip, destination_ip, port, protocol, size, status } = packetData;
  const now = Date.now();

  const detections = [];

  /* ── 1. PORT SCAN DETECTION ──────────────────
     Trigger: 1 IP → 8+ different ports in 60s
     Severity: HIGH
  ─────────────────────────────────────────── */
  if (port && source_ip) {
    cleanOldEntries(portScanTracker, WINDOW_MS);
    const entry = portScanTracker.get(source_ip) || { ports: new Set(), firstSeen: now };
    entry.ports.add(port);
    portScanTracker.set(source_ip, entry);

    if (entry.ports.size >= PORT_SCAN_THR) {
      const dedupKey = `PORT_SCAN:${source_ip}`;
      detections.push(createAlert({
        type: 'PORT_SCAN',
        severity: entry.ports.size >= 20 ? 'critical' : 'high',
        description: `Port scanning aniqlandi: ${source_ip} — ${entry.ports.size} ta port skanerlandi (1 daqiqada)`,
        source_ip,
        target_ip: destination_ip,
        status: 'active',
        risk_score: Math.min(95, 60 + entry.ports.size * 2),
      }, dedupKey));
    }
  }

  /* ── 2. BRUTE FORCE DETECTION ────────────────
     Trigger: same src IP → SSH/FTP/HTTP port → 10+ times in 60s
     Severity: HIGH → CRITICAL
  ─────────────────────────────────────────── */
  const brutePorts = [22, 21, 3389, 23, 80, 443, 8080];
  if (port && brutePorts.includes(Number(port)) && source_ip) {
    cleanOldEntries(bruteForceTracker, WINDOW_MS);
    const entry = bruteForceTracker.get(source_ip) || { count: 0, firstSeen: now };
    entry.count++;
    bruteForceTracker.set(source_ip, entry);

    if (entry.count >= BRUTE_THR) {
      const dedupKey = `BRUTE_FORCE:${source_ip}:${port}`;
      detections.push(createAlert({
        type: 'BRUTE_FORCE',
        severity: entry.count >= 30 ? 'critical' : 'high',
        description: `Brute force hujumi: ${source_ip} → port ${port} ga ${entry.count} ta urinish (1 daqiqada)`,
        source_ip,
        target_ip: destination_ip,
        status: 'active',
        risk_score: Math.min(95, 55 + entry.count * 1.5),
      }, dedupKey));
    }
  }

  /* ── 3. ARP SPOOFING DETECTION ───────────────
     Trigger: same IP → different MAC address changes
     Note: For simulation, we use IP→destination correlation
     Severity: CRITICAL
  ─────────────────────────────────────────── */
  if (protocol && protocol.toUpperCase() === 'ARP' && source_ip) {
    const prevDest = arpTracker.get(source_ip);
    if (prevDest && prevDest !== destination_ip) {
      const dedupKey = `ARP_SPOOF:${source_ip}`;
      detections.push(createAlert({
        type: 'ARP_SPOOFING',
        severity: 'critical',
        description: `ARP Spoofing aniqlandi: ${source_ip} dan manzil o'zgarishi (${prevDest} → ${destination_ip})`,
        source_ip,
        target_ip: destination_ip,
        status: 'active',
        risk_score: 92,
      }, dedupKey));
    }
    arpTracker.set(source_ip, destination_ip);
  }

  /* ── 4. DDOS DETECTION ───────────────────────
     Trigger: same source → 50+ packets in 60s
     Severity: CRITICAL
  ─────────────────────────────────────────── */
  if (source_ip) {
    cleanOldEntries(ddosTracker, WINDOW_MS);
    const entry = ddosTracker.get(source_ip) || { count: 0, firstSeen: now };
    entry.count++;
    ddosTracker.set(source_ip, entry);

    if (entry.count >= DDOS_THR && entry.count % 10 === 0) { // every 10 after threshold
      const dedupKey = `DDOS:${source_ip}:${Math.floor(entry.count / 10)}`;
      detections.push(createAlert({
        type: 'DDOS_ATTACK',
        severity: 'critical',
        description: `DDoS hujumi: ${source_ip} dan ${entry.count} ta paket yuborilyapti (1 daqiqada)`,
        source_ip,
        target_ip: destination_ip,
        status: 'active',
        risk_score: 95,
      }, dedupKey));
    }
  }

  /* ── 5. DATA EXFILTRATION ───────────────────
     Trigger: Large packet (>1400 bytes)
     Severity: HIGH
  ─────────────────────────────────────────── */
  if (size > 1400) {
    const dedupKey = `EXFIL:${source_ip}:${Math.floor(Date.now() / 30000)}`; // once per 30s
    detections.push(createAlert({
      type: 'DATA_EXFILTRATION',
      severity: size > 9000 ? 'critical' : 'high',
      description: `Katta paket aniqlandi: ${source_ip} → ${size} bytes (ma'lumot chiqishi bo'lishi mumkin)`,
      source_ip,
      target_ip: destination_ip,
      status: 'active',
      risk_score: Math.min(90, 60 + Math.floor(size / 100)),
    }, dedupKey));
  }

  /* ── 6. INSECURE PROTOCOL ────────────────────
     FTP, Telnet, HTTP (port 80) — plain text
     Severity: MEDIUM → HIGH
  ─────────────────────────────────────────── */
  const insecureProtos = ['ftp', 'telnet'];
  if (protocol && insecureProtos.includes(protocol.toLowerCase())) {
    const dedupKey = `INSECURE:${protocol.toUpperCase()}:${source_ip}:${Math.floor(Date.now() / 60000)}`;
    detections.push(createAlert({
      type: 'INSECURE_PROTOCOL',
      severity: protocol.toLowerCase() === 'telnet' ? 'high' : 'medium',
      description: `Xavfsiz bo'lmagan protokol: ${protocol.toUpperCase()} ishlatilmoqda — ${source_ip} → ${destination_ip}`,
      source_ip,
      target_ip: destination_ip,
      status: 'active',
      risk_score: protocol.toLowerCase() === 'telnet' ? 80 : 60,
    }, dedupKey));
  }

  /* ── 7. KNOWN ATTACK PACKET (from simulation) ─
     If status is explicitly "attack"
  ─────────────────────────────────────────── */
  if (status === 'attack') {
    const dedupKey = `ATTACK:${source_ip}:${port}:${Math.floor(Date.now() / 10000)}`;
    detections.push(createAlert({
      type: 'NETWORK_ATTACK',
      severity: 'high',
      description: `Tarmoq hujumi paket aniqlandi: ${source_ip} → ${destination_ip}:${port} (${protocol})`,
      source_ip,
      target_ip: destination_ip,
      status: 'active',
      risk_score: 78,
    }, dedupKey));
  }

  // Run all detections in parallel (errors silently caught)
  await Promise.allSettled(detections);
};

/* ── Threat Score Calculator ─────────────────── */
exports.calculateThreatScore = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [criticals, highs, attacks, suspicious] = await Promise.all([
      prisma.alert.count({ where: { severity: 'critical', status: 'active', timestamp: { gte: oneHourAgo } } }),
      prisma.alert.count({ where: { severity: 'high',     status: 'active', timestamp: { gte: oneHourAgo } } }),
      prisma.packet.count({ where: { status: 'attack',     timestamp: { gte: oneHourAgo } } }),
      prisma.packet.count({ where: { status: 'suspicious', timestamp: { gte: oneHourAgo } } }),
    ]);

    const penalty = criticals * 12 + highs * 6 + attacks * 2 + suspicious * 0.5;
    return Math.max(0, Math.round(100 - penalty));
  } catch {
    return 75; // default
  }
};

/* ── Export trackers for stats endpoint ── */
exports.getTrackerStats = () => ({
  monitored_ips: portScanTracker.size + bruteForceTracker.size,
  port_scan_suspects: portScanTracker.size,
  brute_force_suspects: bruteForceTracker.size,
  ddos_suspects: ddosTracker.size,
});
