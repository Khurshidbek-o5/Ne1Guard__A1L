import { useEffect, useState, useMemo } from "react";
import { apiClient } from "@/api/apiClient";
import { 
  Network, ShieldAlert, Search, ArrowRightLeft, 
  Shield, Zap, Lock, Unlock, RefreshCw, Database, 
  Monitor, Globe, Server, Cpu
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "react-i18next";

const ZONES = [
  { id: "internal", name: "INTERNAL DATA CENTER", color: "text-emerald-500", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
  { id: "dmz", name: "DMZ / PUBLIC SERVERS", color: "text-blue-500", border: "border-blue-500/20", bg: "bg-blue-500/5" },
  { id: "lan", name: "CORPORATE LAN / WORKSTATIONS", color: "text-purple-500", border: "border-purple-500/20", bg: "bg-purple-500/5" },
  { id: "wan", name: "UNTRUSTED WAN / INTERNET", color: "text-red-500", border: "border-red-500/20", bg: "bg-red-500/5" }
];

export default function NetworkMap() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ devices: [], alerts: [], packets: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterThreats, setFilterThreats] = useState(false);

  // Scan simulation states
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState([]);

  // Isolated nodes state (local simulation for pro actions)
  const [isolatedNodes, setIsolatedNodes] = useState(new Set());

  const loadNetworkData = async () => {
    setLoading(true);
    try {
      const [devices, alerts, packets] = await Promise.all([
        apiClient.getDevices().catch(() => []),
        apiClient.getAlerts().catch(() => []),
        apiClient.getPackets().catch(() => [])
      ]);
      setData({ 
        devices: Array.isArray(devices) ? devices : [], 
        alerts: Array.isArray(alerts) ? alerts : [], 
        packets: Array.isArray(packets) ? packets : [] 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadNetworkData(); 
  }, []);

  // Compute node zone helper
  const getNodeZone = (ip) => {
    if (ip.startsWith("192.168.1.100") || ip.startsWith("192.168.1.101") || ip.startsWith("192.168.1.102") || ip.startsWith("192.168.1.105") || ip.startsWith("192.168.1.15")) {
      return "lan";
    }
    if (ip.startsWith("192.168.1.1") || ip.startsWith("192.168.1.10")) {
      return "internal";
    }
    if (ip.startsWith("10.") || ip.startsWith("172.16.")) {
      return "dmz";
    }
    if (ip.startsWith("192.168.1.")) {
      return "lan";
    }
    return "wan";
  };

  // Build high-performance nodes with computed coordinates
  const nodes = useMemo(() => {
    const nodeMap = new Map();

    // 1. Add registered devices
    data.devices.forEach((d) => {
      const zone = getNodeZone(d.ip_address);
      nodeMap.set(d.ip_address, {
        id: d.ip_address,
        name: d.hostname || d.ip_address,
        ip: d.ip_address,
        type: d.device_type,
        status: isolatedNodes.has(d.ip_address) ? "isolated" : d.status,
        mac: d.mac_address || "N/A",
        zone: zone,
        connections: 0,
        alertsCount: 0,
        modelName: d.modelName || "",
        tonerLevel: d.tonerLevel,
        pageCount: d.pageCount
      });
    });

    // 2. Add raw packet IP hosts (external internet, etc.)
    data.packets.forEach((p) => {
      [p.source_ip, p.destination_ip].forEach((ip) => {
        if (!nodeMap.has(ip)) {
          const zone = getNodeZone(ip);
          nodeMap.set(ip, {
            id: ip,
            name: ip,
            ip: ip,
            type: zone === "wan" ? "external" : "unknown",
            status: "online",
            mac: "N/A",
            zone: zone,
            connections: 0,
            alertsCount: 0
          });
        }
        nodeMap.get(ip).connections++;
      });
    });

    // 3. Attach threats / alert counts
    data.alerts.forEach((alert) => {
      if (alert.status !== 'active') return;
      if (alert.source_ip && nodeMap.has(alert.source_ip)) {
        nodeMap.get(alert.source_ip).alertsCount += alert.severity === 'critical' ? 5 : 2;
      }
      if (alert.target_ip && nodeMap.has(alert.target_ip)) {
        nodeMap.get(alert.target_ip).alertsCount += alert.severity === 'critical' ? 3 : 1;
      }
    });

    // 4. Assign visual coordinates based on Zonal layout
    const zoneCounts = { internal: 0, dmz: 0, lan: 0, wan: 0 };
    return Array.from(nodeMap.values()).map((node) => {
      const z = node.zone;
      const count = zoneCounts[z];
      zoneCounts[z]++;

      // Distribute nodes vertically inside their horizontal zone column
      // Zone layout spans: Internal (0-22%), DMZ (25-47%), LAN (50-72%), WAN (75-97%)
      let cx = 50;
      let cy = 50;

      if (z === "internal") {
        cx = 12 + (count % 2) * 8;
        cy = 20 + count * 22;
      } else if (z === "dmz") {
        cx = 36 + (count % 2) * 8;
        cy = 20 + count * 20;
      } else if (z === "lan") {
        cx = 62 + (count % 2) * 8;
        cy = 18 + count * 16;
      } else {
        cx = 88 + (count % 2) * 6;
        cy = 25 + count * 25;
      }

      return {
        ...node,
        cx,
        cy,
        radius: Math.min(22, 10 + node.connections * 0.4 + node.alertsCount * 1.5)
      };
    });
  }, [data, isolatedNodes]);

  // Compute connections (links) between nodes from packets
  const links = useMemo(() => {
    const linkList = [];
    const linkKeys = new Set();

    data.packets.slice(0, 80).forEach((p) => {
      const source = nodes.find((n) => n.ip === p.source_ip);
      const target = nodes.find((n) => n.ip === p.destination_ip);

      if (source && target && source.ip !== target.ip) {
        const key = [source.ip, target.ip].sort().join("-");
        if (!linkKeys.has(key)) {
          linkKeys.add(key);
          linkList.push({
            id: key,
            source,
            target,
            status: p.status, // 'attack' | 'suspicious' | 'normal'
            protocol: p.protocol
          });
        }
      }
    });

    return linkList;
  }, [data.packets, nodes]);

  // Filtered nodes for the side list search
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchesSearch = n.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            n.ip.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesThreat = !filterThreats || n.alertsCount > 0;
      return matchesSearch && matchesThreat;
    });
  }, [nodes, searchTerm, filterThreats]);

  // Handle Isolation
  const handleToggleIsolate = (ip) => {
    if (isolatedNodes.has(ip)) {
      setIsolatedNodes(prev => {
        const next = new Set(prev);
        next.delete(ip);
        return next;
      });
      toast.success(`Host ${ip} blokdan chiqarildi va tarmoqqa qaytarildi.`);
    } else {
      setIsolatedNodes(prev => {
        const next = new Set(prev);
        next.add(ip);
        return next;
      });
      toast.error(`Host ${ip} butunlay izolyatsiya qilindi va tarmoq trafigi to'xtatildi!`, {
        description: "DACL qoidalari va jismoniy port vaqtincha bloklandi."
      });
    }
  };

  // Simulate Vulnerability Scan
  const handleStartScan = (node) => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanLogs([`Starting security vulnerability scan on ${node.ip}...`]);

    const steps = [
      { p: 15, log: "ICMP Echo request and packet response latency: 2ms (Ready)" },
      { p: 35, log: "Checking ports 21, 22, 80, 443, 3389, 8080..." },
      { p: 55, log: "Port 22 [SSH] Open - Banner: OpenSSH 8.4p1 (Clean)" },
      { p: 75, log: node.alertsCount > 0 ? "Potential threat detected: Suspected anomalous packet stream." : "Scanning OS vulnerabilities: CVE database match 100% clean." },
      { p: 90, log: "Analysing SSL/TLS cipher suites..." },
      { p: 100, log: node.alertsCount > 0 ? "Scan completed. WARNING: Found 1 medium threat." : "Scan completed. Status: SECURE." }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setScanProgress(step.p);
        setScanLogs(prev => [...prev, step.log]);
        if (step.p === 100) {
          setIsScanning(false);
        }
      }, (idx + 1) * 800);
    });
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Network className="h-7 w-7 text-primary" />
              Advanced Network Topology
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary">SIEM ANALYTICS v3.0</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Haqiqiy vaqtdagi tarmoq ulanishlari, ma'lumotlar oqimi jurnali va tahdid zonalari vizualizatsiyasi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadNetworkData} 
            disabled={loading || user?.role !== 'developer'}
            className="h-9 gap-1.5 font-semibold text-xs border border-border bg-card/40 hover:bg-card/80"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Tarmoqni Skrining Qilish
          </Button>
          
          <div className="flex flex-col px-3 py-1.5 border border-border bg-card/40 rounded-lg">
             <span className="text-[10px] text-muted-foreground uppercase font-mono">Tahdid darajasi</span>
             <div className="flex items-center gap-1.5 font-mono text-xs text-primary">
                <Zap className="h-3 w-3 animate-pulse" />
                ACTIVE PROTECTION
             </div>
          </div>
        </div>
      </div>

      {user?.role !== 'developer' ? (
        <div className="text-center py-24 border border-dashed border-destructive/30 rounded-2xl bg-destructive/5">
           <Shield className="h-16 w-16 text-destructive/30 mx-auto mb-5 animate-bounce" />
           <h2 className="text-xl font-bold text-destructive uppercase tracking-wider">Kirish Cheklangan</h2>
           <p className="text-muted-foreground mt-3 max-w-sm mx-auto font-mono text-xs">
             Tarmoq topologiyasi xaritasi va ma'lumotlar oqimi faqat tizim ma'muri (developer) tomonidan boshqarilishi mumkin.
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Main Visual SVG Topology Canvas (Spans 3 cols) */}
          <Card className="xl:col-span-3 h-[640px] border-border/60 bg-[hsl(222,28%,3%)] relative overflow-hidden flex flex-col">
            
            {/* Grid Tech Background Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,24,38,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.4)_1px,transparent_1px)] bg-[size:20px_20px] opacity-70" />
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(3,7,18,0.85)_95%)]" />

            {/* Topology Legend Header */}
            <div className="absolute top-4 left-4 z-10 flex gap-4 text-[10px] font-mono p-2.5 rounded-lg bg-background/85 border border-border/50 backdrop-blur-md">
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 glow-green" />Xavfsiz</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse glow-red" />Tahdid</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500 glow-blue" />Tashqi IP</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />Izolyatsiya</div>
            </div>

            {/* Dynamic Interactive SVG Canvas */}
            <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
              <svg className="w-full h-full" viewBox="0 0 1000 560" preserveAspectRatio="none">
                
                {/* SVG Zonal Borders & Background Gradients */}
                {/* Zone 1: Data Center */}
                <rect x="0" y="0" width="230" height="560" fill="rgba(16,185,129,0.02)" stroke="rgba(16,185,129,0.08)" strokeWidth="1.5" />
                {/* Zone 2: DMZ */}
                <rect x="235" y="0" width="240" height="560" fill="rgba(59,130,246,0.02)" stroke="rgba(59,130,246,0.08)" strokeWidth="1.5" />
                {/* Zone 3: LAN */}
                <rect x="480" y="0" width="270" height="560" fill="rgba(168,85,247,0.02)" stroke="rgba(168,85,247,0.08)" strokeWidth="1.5" />
                {/* Zone 4: WAN */}
                <rect x="755" y="0" width="245" height="560" fill="rgba(239,68,68,0.01)" stroke="rgba(239,68,68,0.08)" strokeWidth="1.5" />

                {/* SVG Network Link Lines */}
                {links.map((link) => {
                  const isAttack = link.status === "attack";
                  const isSuspicious = link.status === "suspicious";
                  const isIsolated = link.source.status === "isolated" || link.target.status === "isolated";
                  
                  let strokeColor = "rgba(16,185,129,0.25)";
                  if (isIsolated) strokeColor = "rgba(100,116,139,0.15)";
                  else if (isAttack) strokeColor = "rgba(239,68,68,0.7)";
                  else if (isSuspicious) strokeColor = "rgba(245,158,11,0.5)";

                  return (
                    <g key={link.id} className="transition-opacity duration-300">
                      {/* Connection path line */}
                      <line 
                        x1={`${link.source.cx}%`} 
                        y1={`${link.source.cy}%`} 
                        x2={`${link.target.cx}%`} 
                        y2={`${link.target.cy}%`} 
                        stroke={strokeColor} 
                        strokeWidth={isAttack ? 3 : isSuspicious ? 2 : 1.5}
                        className={cn(isAttack && "animate-pulse")}
                        style={{
                          filter: isAttack ? "drop-shadow(0 0 4px rgba(239,68,68,0.5))" : "none"
                        }}
                      />
                      
                      {/* Animated packet circles moving along connection line */}
                      {!isIsolated && (
                        <circle r={isAttack ? 3 : 2} fill={isAttack ? "#ef4444" : isSuspicious ? "#f59e0b" : "#10b981"}>
                          <animate 
                            attributeName="cx" 
                            from={`${link.source.cx}%`} 
                            to={`${link.target.cx}%`} 
                            dur={isAttack ? "1s" : isSuspicious ? "2s" : "3.5s"} 
                            repeatCount="indefinite" 
                          />
                          <animate 
                            attributeName="cy" 
                            from={`${link.source.cy}%`} 
                            to={`${link.target.cy}%`} 
                            dur={isAttack ? "1s" : isSuspicious ? "2s" : "3.5s"} 
                            repeatCount="indefinite" 
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {/* SVG Nodes */}
                {nodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isAttack = node.alertsCount > 0;
                  const isIsolated = node.status === "isolated";
                  
                  let nodeColor = "#10b981"; // Safe Green
                  if (isIsolated) nodeColor = "#64748b"; // Gray
                  else if (isAttack) nodeColor = "#ef4444"; // Danger Red
                  else if (node.type === "external") nodeColor = "#3b82f6"; // Internet Blue

                  return (
                    <g 
                      key={node.id} 
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer group select-none"
                    >
                      {/* Selection Glow Ring */}
                      {isSelected && (
                        <circle 
                          cx={`${node.cx}%`} 
                          cy={`${node.cy}%`} 
                          r={node.radius + 7} 
                          fill="none" 
                          stroke={nodeColor} 
                          strokeWidth="2" 
                          className="animate-ping opacity-35" 
                        />
                      )}

                      {/* Outer Pulse Alert Ring */}
                      {isAttack && !isIsolated && (
                        <circle 
                          cx={`${node.cx}%`} 
                          cy={`${node.cy}%`} 
                          r={node.radius + 5} 
                          fill="none" 
                          stroke="#ef4444" 
                          strokeWidth="1.5" 
                          className="animate-pulse" 
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle 
                        cx={`${node.cx}%`} 
                        cy={`${node.cy}%`} 
                        r={node.radius} 
                        fill="#0b1121" 
                        stroke={nodeColor} 
                        strokeWidth={isSelected ? 3.5 : 2.5}
                        className="transition-all duration-300 group-hover:fill-muted/20"
                        style={{
                          filter: isAttack && !isIsolated 
                            ? "drop-shadow(0 0 10px rgba(239,68,68,0.7))" 
                            : isSelected 
                            ? `drop-shadow(0 0 8px ${nodeColor})` 
                            : "none"
                        }}
                      />

                      {/* Icon overlay inside Node circle based on type */}
                      <g transform={`translate(0, 0)`} className="pointer-events-none">
                        <text 
                          x={`${node.cx}%`} 
                          y={`${node.cy + 3.5}%`} 
                          fill={nodeColor}
                          fontSize="10" 
                          fontWeight="bold" 
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          {node.type === "router" ? "RT" :
                           node.type === "server" ? "SRV" :
                           node.type === "printer" ? "PRT" :
                           node.type === "external" ? "WAN" : "PC"}
                        </text>
                      </g>

                      {/* Hostname labels under nodes */}
                      <text 
                        x={`${node.cx}%`} 
                        y={`${node.cy + node.radius + 15}%`} 
                        fill={isSelected ? "#fff" : "rgba(255,255,255,0.55)"}
                        fontSize="8.5" 
                        fontFamily="monospace"
                        fontWeight={isSelected ? "bold" : "normal"}
                        textAnchor="middle"
                        className="pointer-events-none group-hover:fill-white transition-colors"
                      >
                        {node.name.length > 15 ? `${node.name.substring(0,12)}...` : node.name}
                      </text>
                    </g>
                  );
                })}

              </svg>
            </div>

            {/* Labeled footer zone identifiers */}
            <div className="border-t border-border/30 bg-muted/20 py-2.5 px-4 flex justify-between text-[9px] font-mono text-muted-foreground/60 font-bold tracking-widest uppercase select-none">
              <span className="flex items-center gap-1"><Database className="h-3.5 w-3.5" /> SECURE STORAGE</span>
              <span className="flex items-center gap-1"><Server className="h-3.5 w-3.5" /> WEB SERVERS (DMZ)</span>
              <span className="flex items-center gap-1"><Monitor className="h-3.5 w-3.5" /> OFFICE LAN</span>
              <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> EXTERNAL INTERNET</span>
            </div>
          </Card>

          {/* Right Sidebar Control & Diagnostic Panel (Spans 1 col) */}
          <div className="space-y-6">
            
            {/* Search and Filters */}
            <Card className="p-4 border-border/60 bg-card/40 space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Uzel IP yoki nomi..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-3">
                <span className="text-[10px] text-muted-foreground uppercase font-mono font-bold tracking-wide">Faqat tahdidlarni ko'rsatish</span>
                <button
                  onClick={() => setFilterThreats(prev => !prev)}
                  className={cn(
                    "w-9 h-4.5 rounded-full p-0.5 transition-colors relative flex items-center shrink-0 border border-border/40",
                    filterThreats ? "bg-red-500" : "bg-muted"
                  )}
                >
                  <span 
                    className={cn(
                      "h-3 w-3 rounded-full bg-white transition-transform block",
                      filterThreats ? "translate-x-4.5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </Card>

            {/* Selected Node Details Profile */}
            {selectedNode ? (
              <Card className="p-5 border-border/60 bg-card/65 shadow-2xl relative space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* Node Header status */}
                <div className="flex justify-between items-start pb-3 border-b border-border/40">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-base font-mono truncate max-w-[170px]">{selectedNode.name}</h3>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{selectedNode.ip}</p>
                  </div>
                  
                  {selectedNode.status === "isolated" ? (
                    <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20 text-[9px] font-mono uppercase tracking-wider flex items-center gap-1">
                      <Lock className="h-3 w-3" /> ISOLATED
                    </Badge>
                  ) : selectedNode.alertsCount > 0 ? (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 animate-pulse">
                      <ShieldAlert className="h-3 w-3" /> ATTACK
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-mono tracking-wider">
                      SECURE
                    </Badge>
                  )}
                </div>

                {/* Node Metadata Parameters */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded bg-secondary/20 border border-border/30">
                    <span className="text-muted-foreground">Tarmoq segmenti:</span> 
                    <span className="font-bold uppercase tracking-wider text-[10px]">{selectedNode.zone}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-secondary/20 border border-border/30">
                    <span className="text-muted-foreground">MAC Manzil:</span> 
                    <span className="font-bold text-[10px]">{selectedNode.mac}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-secondary/20 border border-border/30">
                    <span className="text-muted-foreground">Ulanishlar soni:</span> 
                    <span className="font-bold">{selectedNode.connections} ta</span>
                  </div>
                  <div className={cn(
                    "flex justify-between p-2 rounded border", 
                    selectedNode.alertsCount > 0 
                      ? "bg-red-500/5 border-red-500/20 text-red-500" 
                      : "bg-secondary/20 border-border/30"
                  )}>
                    <span>Risk darajasi (Score):</span> 
                    <span className="font-bold">
                      {selectedNode.alertsCount > 0 ? `${selectedNode.alertsCount * 12} (HIGH)` : "0 (CLEAN)"}
                    </span>
                  </div>
                </div>

                {/* Operations & Action Commands */}
                <div className="space-y-2.5 pt-3 border-t border-border/40">
                  <h4 className="text-[10px] text-muted-foreground uppercase font-mono font-bold tracking-wide">Ma'muriy buyruqlar</h4>
                  
                  <div className="flex gap-2">
                    {/* Isolation Toggle */}
                    <Button 
                      onClick={() => handleToggleIsolate(selectedNode.ip)}
                      variant={selectedNode.status === "isolated" ? "outline" : "destructive"} 
                      size="sm" 
                      className="flex-1 text-xs font-bold gap-1"
                    >
                      {selectedNode.status === "isolated" ? (
                        <><Unlock className="h-3.5 w-3.5" /> Aktivlashtirish</>
                      ) : (
                        <><Lock className="h-3.5 w-3.5" /> Izolyatsiya qilish</>
                      )}
                    </Button>

                    {/* Scan Button */}
                    <Button 
                      onClick={() => handleStartScan(selectedNode)}
                      disabled={isScanning || selectedNode.status === "isolated"}
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs font-bold gap-1"
                    >
                      <Cpu className={cn("h-3.5 w-3.5", isScanning && "animate-spin")} /> Skrining
                    </Button>
                  </div>
                </div>

                {/* Diagnostic vulnerability scan screen simulation */}
                <AnimatePresence>
                  {(isScanning || scanLogs.length > 0) && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pt-3 border-t border-border/40"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                        <span>Skrining yuklamasi</span>
                        <span>{scanProgress}%</span>
                      </div>
                      <Progress value={scanProgress} className="h-1.5" />
                      
                      {/* Diagnostics logs */}
                      <div className="bg-black/90 p-2.5 rounded border border-border/50 font-mono text-[9px] text-emerald-500 max-h-32 overflow-y-auto space-y-1">
                        {scanLogs.map((log, idx) => (
                          <div key={idx} className="flex gap-1.5">
                            <span className="text-muted-foreground/60">&gt;</span>
                            <span className="break-all">{log}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </Card>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground border border-dashed border-border/40 rounded-xl bg-card/20 p-4">
                <ArrowRightLeft className="h-8 w-8 mb-2 opacity-25" />
                <p className="text-xs font-mono uppercase tracking-wider">Tanlov kutilmoqda</p>
                <p className="text-[10.5px] text-muted-foreground/80 mt-1">Batafsil ma'lumot va ma'muriy operatsiyalar uchun xaritadan uzelni tanlang.</p>
              </div>
            )}

            {/* Mini Summary metrics */}
            <Card className="p-4 border-border/60 bg-card/30 space-y-3 font-mono text-xs">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide block">Tarmoq Statistikasi</span>
              <div className="flex justify-between border-b border-border/30 pb-1.5">
                <span className="text-muted-foreground">Tugunlar soni (Nodes):</span>
                <span className="font-bold text-foreground">{nodes.length} ta</span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-1.5">
                <span className="text-muted-foreground">Ulanishlar (Links):</span>
                <span className="font-bold text-foreground">{links.length} ta</span>
              </div>
              <div className="flex justify-between text-red-500 font-bold">
                <span>Tahdid Ostida:</span>
                <span>{nodes.filter(n => n.alertsCount > 0).length} ta host</span>
              </div>
            </Card>

          </div>

        </div>
      )}
    </div>
  );
}
