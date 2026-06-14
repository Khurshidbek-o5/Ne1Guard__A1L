import { cn } from "@/lib/utils";
import MiniSparkline from "./MiniSparkline";
import LiveCounter from "./LiveCounter";

function GaugeBar({ value, max = 100, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function getColor(value) {
  if (value >= 85) return "#ef4444";
  if (value >= 65) return "#f59e0b";
  return "#22c55e";
}

export default function SystemHealthGauge({ metrics = {}, history = [] }) {
  const safeMetrics = metrics || {};
  const safeHistory = history || [];

  const items = [
    {
      label: "CPU",
      value: safeMetrics.cpu ?? 0,
      unit: "%",
      max: 100,
      histKey: "cpu",
      color: getColor(safeMetrics.cpu ?? 0),
      sparkColor: "#38bdf8",
    },
    {
      label: "Memory",
      value: safeMetrics.memory ?? 0,
      unit: "%",
      max: 100,
      histKey: "memory",
      color: getColor(safeMetrics.memory ?? 0),
      sparkColor: "#a78bfa",
    },
    {
      label: "Net IN",
      value: safeMetrics.network_in ?? 0,
      unit: "Mb/s",
      max: 1000,
      histKey: "network_in",
      color: "#22c55e",
      sparkColor: "#22c55e",
    },
    {
      label: "Net OUT",
      value: safeMetrics.network_out ?? 0,
      unit: "Mb/s",
      max: 1000,
      histKey: "network_out",
      color: "#38bdf8",
      sparkColor: "#38bdf8",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map(item => (
        <div key={item.label} className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono uppercase">{item.label}</span>
            <span className={cn("text-sm font-bold font-mono transition-colors duration-300")} style={{ color: item.color }}>
              <LiveCounter
                value={parseFloat((item.value || 0).toFixed(1))}
                format={(v) => `${(v || 0).toFixed(1)}${item.unit}`}
                className="font-mono font-bold text-sm"
              />
            </span>
          </div>
          <GaugeBar value={item.value} max={item.max} color={item.color} />
          <MiniSparkline data={safeHistory} dataKey={item.histKey} color={item.sparkColor} height={36} />
        </div>
      ))}
    </div>
  );
}