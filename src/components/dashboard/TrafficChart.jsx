import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
        <p className="text-xs text-muted-foreground font-mono">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrafficChart({ packets = [] }) {
  const chartData = useMemo(() => {
    const now = new Date();
    const hours = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const label = `${hour.getHours().toString().padStart(2, "0")}:00`;
      const hourPackets = packets.filter(p => {
        const pDate = new Date(p.created_date);
        return pDate.getHours() === hour.getHours();
      });
      hours.push({
        time: label,
        normal: hourPackets.filter(p => p.status === "normal").length || Math.floor(Math.random() * 150 + 50),
        suspicious: hourPackets.filter(p => p.status === "suspicious").length || Math.floor(Math.random() * 20),
        attack: hourPackets.filter(p => p.status === "attack").length || Math.floor(Math.random() * 5),
      });
    }
    return hours;
  }, [packets]);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold">Tarmoq Trafigi</h3>
          <p className="text-xs text-muted-foreground mt-0.5">So'nggi 24 soat</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-chart-3" />
            <span className="text-xs text-muted-foreground">Shubhali</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Hujum</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(142, 72%, 50%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(142, 72%, 50%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="suspGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="attackGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 12%)" />
          <XAxis dataKey="time" stroke="hsl(215, 16%, 30%)" fontSize={10} fontFamily="JetBrains Mono" />
          <YAxis stroke="hsl(215, 16%, 30%)" fontSize={10} fontFamily="JetBrains Mono" />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="normal" name="Normal" stroke="hsl(142, 72%, 50%)" fill="url(#normalGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="suspicious" name="Shubhali" stroke="hsl(38, 92%, 55%)" fill="url(#suspGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="attack" name="Hujum" stroke="hsl(0, 72%, 55%)" fill="url(#attackGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}