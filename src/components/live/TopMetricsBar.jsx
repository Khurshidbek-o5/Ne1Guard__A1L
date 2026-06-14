import { Activity, AlertTriangle, Shield, Wifi, Clock, Zap } from "lucide-react";
import LiveCounter from "./LiveCounter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

function UptimeDisplay({ hours }) {
  const d = Math.floor(hours / 24);
  const h = Math.floor(hours % 24);
  const m = Math.floor((hours * 60) % 60);
  return <span className="font-mono font-bold text-lg">{d}d {h}h {m}m</span>;
}

export default function TopMetricsBar({ metrics = {}, totalPackets = 0, alertCount = 0, threats = [] }) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    setBlink(true);
    const t = setTimeout(() => setBlink(false), 600);
    return () => clearTimeout(t);
  }, [alertCount]);

  const activeThreats = (threats || []).filter(t => !t.blocked).length;

  const items = [
    {
      icon: Activity,
      label: "Jami Paketlar",
      value: <LiveCounter value={totalPackets ?? 0} className="font-mono font-bold text-lg" />,
      sub: <span className="font-mono text-[10px]">{(metrics?.packets_per_sec ?? 0)} pkt/s</span>,
      variant: "info",
    },
    {
      icon: Zap,
      label: "Ulanishlar",
      value: <LiveCounter value={metrics?.connections ?? 0} className="font-mono font-bold text-lg" />,
      sub: <span className="font-mono text-[10px]">faol sessiyalar</span>,
      variant: "success",
    },
    {
      icon: AlertTriangle,
      label: "Ogohlantirishlar",
      value: <span className={cn("font-mono font-bold text-lg transition-colors", blink ? "text-destructive" : "text-foreground")}>{alertCount ?? 0}</span>,
      sub: <span className="font-mono text-[10px] text-destructive">{activeThreats} faol tahdid</span>,
      variant: activeThreats > 0 ? "danger" : "warning",
    },
    {
      icon: Shield,
      label: "Bloklangan",
      value: <LiveCounter value={metrics?.threats_blocked ?? 0} className="font-mono font-bold text-lg" />,
      sub: <span className="font-mono text-[10px] text-primary">himoyalangan</span>,
      variant: "success",
    },
    {
      icon: Wifi,
      label: "Kechikish",
      value: <LiveCounter value={metrics?.latency ?? 0} format={v => `${(v || 0).toFixed(0)}ms`} className="font-mono font-bold text-lg" />,
      sub: <span className="font-mono text-[10px]">{(metrics?.packet_loss ?? 0).toFixed(2)}% yo'qolish</span>,
      variant: (metrics?.latency ?? 0) > 50 ? "warning" : "success",
    },
    {
      icon: Clock,
      label: "Uptime",
      value: <UptimeDisplay hours={metrics?.uptime_hours ?? 0} />,
      sub: <span className="font-mono text-[10px] text-primary">● LIVE</span>,
      variant: "info",
    },
  ];

  const variantBorder = {
    info: "border-accent/20",
    success: "border-primary/20",
    warning: "border-chart-3/20",
    danger: "border-destructive/30",
  };
  const variantIcon = {
    info: "text-accent bg-accent/10",
    success: "text-primary bg-primary/10",
    warning: "text-chart-3 bg-chart-3/10",
    danger: "text-destructive bg-destructive/10",
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {items.map(item => (
        <div key={item.label} className={cn(
          "bg-card border rounded-xl p-4 transition-all duration-300 cursor-default",
          "hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40",
          variantBorder[item.variant]
        )}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
            <div className={cn("h-6 w-6 rounded flex items-center justify-center", variantIcon[item.variant])}>
              <item.icon className="h-3 w-3" />
            </div>
          </div>
          <div>{item.value}</div>
          <div className="mt-0.5 text-muted-foreground">{item.sub}</div>
        </div>
      ))}
    </div>
  );
}