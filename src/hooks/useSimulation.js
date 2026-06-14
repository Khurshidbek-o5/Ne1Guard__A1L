import { useState, useEffect, useRef } from "react";
import { apiClient } from "../api/apiClient";

// Realistic IP pool
const INTERNAL_IPS = [
  "192.168.1.1", "192.168.1.10", "192.168.1.20", "192.168.1.50",
  "192.168.1.100", "192.168.1.150", "192.168.1.200", "192.168.1.25",
  "192.168.1.35", "192.168.1.45",
];
const EXTERNAL_IPS = [
  "45.33.32.156", "104.21.8.1", "172.67.68.1", "1.1.1.1", "8.8.8.8",
  "91.108.4.1", "52.40.62.49", "13.107.42.14", "185.220.101.55",
  "198.51.100.42", "203.0.113.99", "10.0.0.99", "172.16.0.55",
];
const PROTOCOLS = ["TCP", "UDP", "ICMP", "ARP", "HTTP", "HTTPS", "DNS", "SSH", "FTP"];
const COUNTRIES = ["Russia", "China", "Ukraine", "Brazil", "Iran", "USA", "Germany", "Netherlands"];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomFloat(min, max, dp = 1) { return parseFloat((Math.random() * (max - min) + min).toFixed(dp)); }

// Generate a realistic packet
function generatePacket() {
  const isAttack = Math.random() < 0.08;
  const isSuspicious = !isAttack && Math.random() < 0.12;
  const status = isAttack ? "attack" : isSuspicious ? "suspicious" : "normal";
  const src = isAttack ? randomFrom(EXTERNAL_IPS) : randomFrom(INTERNAL_IPS);
  const dst = randomFrom(INTERNAL_IPS);
  const protocol = isAttack ? randomFrom(["TCP", "UDP", "ICMP", "ARP"]) : randomFrom(PROTOCOLS);
  return {
    source_ip: src,
    destination_ip: dst,
    port: isAttack ? randomInt(1, 65535) : randomFrom([80, 443, 22, 53, 8080, 3389, 445, 21, 25]),
    protocol,
    size: randomInt(64, 1500),
    status,
    timestamp: new Date(),
  };
}

// Generate a log entry (Local memory only for simplicity in logs)
function generateLogEntry() {
  const levels = ["INFO", "INFO", "INFO", "WARN", "ERROR", "DEBUG"];
  const level = randomFrom(levels);
  const messages = {
    INFO: [
      `Connection established from ${randomFrom(INTERNAL_IPS)} to ${randomFrom(INTERNAL_IPS)}`,
      `DNS query resolved: api.cloudflare.com → 104.21.8.1`,
    ],
    WARN: [
      `High CPU usage detected on 192.168.1.10: ${randomInt(75, 95)}%`,
    ],
    ERROR: [
      `Connection refused from ${randomFrom(EXTERNAL_IPS)}: port ${randomInt(1, 1024)} blocked`,
    ],
    DEBUG: [
      `Packet capture buffer: ${randomInt(60, 95)}% utilized`,
    ],
  };
  return {
    id: Date.now() + Math.random(),
    level,
    message: randomFrom(messages[level]) || "Status update",
    timestamp: new Date(),
    source: randomFrom(["IDS-Engine", "Firewall", "Auth-Service", "PacketCapture", "ML-Detector", "NetMonitor"]),
  };
}

// Generate system metrics
function generateMetrics(prev) {
  const smoothed = (cur, target, factor = 0.3) => cur + (target - cur) * factor;
  return {
    cpu: smoothed(prev?.cpu ?? 45, randomFloat(15, 85)),
    memory: smoothed(prev?.memory ?? 62, randomFloat(45, 80)),
    network_in: smoothed(prev?.network_in ?? 120, randomFloat(20, 900)),
    network_out: smoothed(prev?.network_out ?? 80, randomFloat(10, 600)),
    packets_per_sec: randomInt(50, 2000),
    connections: randomInt(80, 450),
    threats_blocked: prev ? prev.threats_blocked + (Math.random() < 0.1 ? 1 : 0) : randomInt(0, 50),
    uptime_hours: prev ? prev.uptime_hours + (1 / 3600) : randomFloat(100, 9999),
    latency: smoothed(prev?.latency ?? 12, randomFloat(1, 80)),
    packet_loss: smoothed(prev?.packet_loss ?? 0.1, randomFloat(0, 2.5), 0.1),
  };
}

export function useSimulation() {
  const [packets, setPackets] = useState([]);
  const [logs, setLogs] = useState(() => Array.from({ length: 15 }, generateLogEntry));
  const [threats, setThreats] = useState([]);
  const [metrics, setMetrics] = useState(() => generateMetrics(null));
  const [metricsHistory, setMetricsHistory] = useState(() => {
    const now = Date.now();
    return Array.from({ length: 60 }, (_, i) => ({
      t: now - (59 - i) * 2000,
      cpu: randomFloat(20, 70),
      memory: randomFloat(45, 75),
      network_in: randomFloat(50, 500),
      network_out: randomFloat(20, 300),
      packets: randomInt(50, 1200),
    }));
  });
  const [totalPackets, setTotalPackets] = useState(randomInt(10000, 50000));
  const [alertCount, setAlertCount] = useState(randomInt(3, 12));
  const [isLive, setIsLive] = useState(true);

  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  // Sync with backend: Fetch initial threats/alerts
  useEffect(() => {
    apiClient.getAlerts().then(data => {
      if (Array.isArray(data)) {
        setThreats(data.map(a => ({
          ...a,
          blocked: a.status === 'resolved',
          risk_score: a.risk_score || 50
        })));
        setAlertCount(data.length);
      }
    }).catch(err => console.error("Failed to fetch alerts:", err));
  }, []);

  // Packet stream: every 2s generate 1 packet and POST to backend
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const packet = generatePacket();
      
      // Update local state immediately
      const localPacket = { ...packet, id: Date.now() + Math.random() };
      setPackets(prev => [localPacket, ...prev].slice(0, 50));
      setTotalPackets(prev => prev + 1);

      // Save to database
      apiClient.createPacket(packet).catch(err => console.error("Failed to save packet:", err));
    }, 2000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Traffic metrics persistence: every 5s
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const newMetrics = generateMetrics(metricsRef.current);
      setMetrics(newMetrics);
      
      // Save stats to database
      apiClient.createTraffic({
        bytes_in: Math.round(newMetrics.network_in * 1024),
        bytes_out: Math.round(newMetrics.network_out * 1024),
        protocol: 'Aggregated'
      }).catch(err => console.error("Failed to save traffic:", err));

      setMetricsHistory(prev => [
        ...prev.slice(-59),
        {
          t: Date.now(),
          cpu: parseFloat(newMetrics.cpu.toFixed(1)),
          memory: parseFloat(newMetrics.memory.toFixed(1)),
          network_in: parseFloat(newMetrics.network_in.toFixed(0)),
          network_out: parseFloat(newMetrics.network_out.toFixed(0)),
          packets: newMetrics.packets_per_sec,
        },
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  return {
    packets, logs, threats, metrics, metricsHistory,
    totalPackets, alertCount, isLive, setIsLive,
  };
}