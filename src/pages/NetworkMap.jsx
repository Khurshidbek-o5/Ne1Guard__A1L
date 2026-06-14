import { useEffect, useState, useMemo } from "react";
import { apiClient } from "@/api/apiClient";
import { Network, ShieldAlert, CheckCircle2, Search, ArrowRightLeft, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "react-i18next";

const IP_ZONES = {
  "192.168.1.": "Internal Data Center",
  "10.0.": "DMZ Web Servers",
  "172.16.": "Employee Network"
};

function getZone(ip) {
  for (const [prefix, name] of Object.entries(IP_ZONES)) {
    if (ip.startsWith(prefix)) return name;
  }
  return "External Internet";
}

export default function NetworkMap() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ devices: [], alerts: [], packets: [] });
  const [selectedNode, setSelectedNode] = useState(null);

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

  useEffect(() => { loadNetworkData(); }, []);

  const graphNodes = useMemo(() => {
    const nodes = new Map();
    data.devices.forEach(d => {
      nodes.set(d.ip_address, {
        id: d.ip_address,
        type: "device",
        name: d.hostname || d.ip_address,
        status: d.status,
        zone: getZone(d.ip_address),
        connections: 0,
        attacks: 0,
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    });
    data.packets.forEach(p => {
      [p.source_ip, p.destination_ip].forEach(ip => {
        if (!nodes.has(ip)) {
          nodes.set(ip, {
            id: ip,
            type: getZone(ip) === "External Internet" ? "external" : "unknown",
            name: ip,
            status: "unknown",
            zone: getZone(ip),
            connections: 0,
            attacks: 0,
            x: Math.random() * 100,
            y: Math.random() * 100,
          });
        }
        nodes.get(ip).connections++;
      });
      if (p.status === "attack") {
        if (nodes.has(p.source_ip)) nodes.get(p.source_ip).attacks++;
      }
    });
    data.alerts.forEach(a => {
      if (a.status !== 'active') return;
      if (nodes.has(a.source_ip)) nodes.get(a.source_ip).attacks += 5;
      if (nodes.has(a.target_ip)) nodes.get(a.target_ip).attacks += 2;
    });
    const zones = ["Internal Data Center", "DMZ Web Servers", "Employee Network", "External Internet"];
    return Array.from(nodes.values()).map(node => {
      const zoneIdx = zones.indexOf(node.zone) !== -1 ? zones.indexOf(node.zone) : 3;
      return {
        ...node,
        x: Math.min(95, Math.max(5, (zoneIdx * 25) + 12 + (Math.random() * 15 - 7))),
        y: Math.min(95, Math.max(5, 50 + (Math.random() * 60 - 30))),
        size: Math.min(1000, 100 + node.connections * 10 + node.attacks * 50)
      };
    });
  }, [data]);

  const CustomTooltip = ({ active, payload }) => {
    const { t } = useTranslation();
    if (active && payload && payload.length) {
      const { name, type, zone, connections, attacks, status } = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-md border border-border/80 p-3 rounded-lg shadow-xl outline outline-1 outline-primary/20">
          <p className="font-mono font-bold text-sm text-foreground">{name}</p>
          <div className="text-[10px] uppercase text-muted-foreground mb-2 mt-0.5">{zone}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-muted-foreground">Type:</span> <span className="font-mono text-right">{type}</span>
            <span className="text-muted-foreground">Status:</span> 
            <span className={cn("font-bold text-right", attacks > 0 ? "text-destructive" : status === 'online' ? "text-primary" : "text-muted-foreground")}>
              {attacks > 0 ? "UNDER ATTACK" : status}
            </span>
            <span className="text-muted-foreground">Conns:</span> <span className="font-mono text-right">{connections}</span>
            <span className="text-muted-foreground">Threats:</span> <span className="font-mono text-right text-destructive">{attacks}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Network className="h-6 w-6 text-accent" />
            Network Topology
          </h1>
          {user?.role !== 'developer' ? (
            <p className="text-sm text-destructive mt-1 font-semibold">Tugunlar xaritasini ko'rish uchun ruxsatingiz yo'q</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">Real-time tarmoq tugunlari va tahdid xaritasi</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={loadNetworkData} disabled={loading || user?.role !== 'developer'}>
          {loading ? <Search className="h-4 w-4 mr-1.5 animate-spin" /> : <Network className="h-4 w-4 mr-1.5" />}
          Lokal xaritani tortish
        </Button>
      </div>

      {user?.role !== 'developer' ? (
        <div className="text-center py-24 border border-dashed border-destructive/30 rounded-2xl bg-destructive/5">
           <Shield className="h-16 w-16 text-destructive/30 mx-auto mb-5" />
           <h2 className="text-xl font-bold text-destructive underline decoration-double underline-offset-4">Maxfiy Ma'lumot</h2>
           <p className="text-muted-foreground mt-3 max-w-sm mx-auto font-mono text-[11px] uppercase tracking-wider">
             Tarmoq topologiyasi va tugunlar joylashuvi faqat tizim ma'muri (developer) tomonidan ko'rilishi mumkin.
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 h-[600px] border-border/60 bg-card/30 relative overflow-hidden card-hover">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-5" />
            <div className="absolute top-4 left-4 z-10 flex gap-3 text-[10px] font-mono p-2 rounded-lg bg-background/80 border border-border/50 backdrop-blur-md">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary/80" />Secure Nodes</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-destructive/80 animate-pulse" />Active Threats</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-accent/60" />External Host</div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 60, right: 20, bottom: 20, left: 20 }}>
                <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                <ZAxis type="number" dataKey="size" range={[60, 400]} />
                <Tooltip content={<CustomTooltip />} cursor={{strokeDasharray: '3 3'}} />
                <Scatter data={graphNodes} onClick={(e) => setSelectedNode(e.payload)}>
                  {graphNodes.map((entry, index) => {
                    let fillColor = "hsl(142 72% 50%)";
                    if (entry.attacks > 0) fillColor = "hsl(0 72% 55%)";
                    else if (entry.type === "external") fillColor = "hsl(195 85% 55%)";
                    else if (entry.status !== "online") fillColor = "hsl(220 16% 50%)";
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={fillColor} 
                        className="cursor-pointer transition-all duration-300 hover:opacity-80"
                        style={{ filter: entry.attacks > 0 ? "drop-shadow(0 0 8px rgba(239,68,68,0.6))" : "drop-shadow(0 0 5px rgba(34,197,94,0.3))" }}
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="absolute bottom-4 left-0 w-full flex justify-around text-xs font-mono text-muted-foreground/40 font-bold tracking-widest uppercase pointer-events-none">
              <span>Data Center</span>
              <span>DMZ Web</span>
              <span>Employee Net</span>
              <span>External Web</span>
            </div>
          </Card>
          <div className="space-y-4">
            <Card className="p-5 border-border/50 bg-secondary/20">
              <h3 className="font-semibold text-sm mb-3">Topologiya Holati</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-mono">Tugunlar (Nodes):</span>
                  <span className="font-bold">{graphNodes.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-mono">Tashqi ulanishlar:</span>
                  <span className="font-bold">{graphNodes.filter(n => n.type === 'external').length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-mono">Tahdid Ostida:</span>
                  <span className={cn("font-bold", graphNodes.some(n => n.attacks > 0) && "text-destructive")}>
                    {graphNodes.filter(n => n.attacks > 0).length}
                  </span>
                </div>
              </div>
            </Card>
            {selectedNode ? (
              <Card className="p-5 border-border/50 bg-secondary/80 animate-in fade-in slide-in-from-right-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-base font-mono">{selectedNode.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{selectedNode.zone}</p>
                  </div>
                  {selectedNode.attacks > 0 ? (
                    <ShieldAlert className="h-5 w-5 text-destructive animate-pulse" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded bg-background/50 border border-border">
                    <span className="text-muted-foreground">Type:</span> <span className="float-right capitalize">{selectedNode.type}</span>
                  </div>
                  <div className="p-2 rounded bg-background/50 border border-border">
                    <span className="text-muted-foreground">Active Conns:</span> <span className="float-right font-mono">{selectedNode.connections}</span>
                  </div>
                  <div className={cn("p-2 rounded border", selectedNode.attacks > 0 ? "bg-destructive/10 border-destructive/30" : "bg-background/50 border-border")}>
                    <span className="text-muted-foreground">Threat Score:</span> 
                    <span className={cn("float-right font-mono font-bold", selectedNode.attacks > 0 ? "text-destructive" : "text-primary")}>
                      {selectedNode.attacks > 0 ? selectedNode.attacks * 15 : "Low Risk"}
                    </span>
                  </div>
                </div>
                {selectedNode.attacks > 0 && (
                  <Button variant="destructive" size="sm" className="w-full mt-4 text-xs font-bold glow-red">
                    Isolate Node
                  </Button>
                )}
              </Card>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-center text-muted-foreground border border-dashed border-border/40 rounded-xl bg-background/30 p-4">
                <ArrowRightLeft className="h-6 w-6 mb-2 opacity-20" />
                <p className="text-xs">Uzel haqida ma'lumot olish uchun grafikda tanlang</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
