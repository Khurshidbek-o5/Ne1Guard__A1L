import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useMemo } from "react";

const COLORS = [
  "hsl(142, 72%, 50%)",
  "hsl(200, 80%, 55%)",
  "hsl(38, 92%, 55%)",
  "hsl(280, 65%, 60%)",
  "hsl(0, 72%, 55%)",
  "hsl(170, 60%, 50%)",
];

export default function ProtocolChart({ packets = [] }) {
  const data = useMemo(() => {
    const protocolCount = {};
    const safePackets = Array.isArray(packets) ? packets : [];
    safePackets.forEach(p => {
      if (p && p.protocol) {
        protocolCount[p.protocol] = (protocolCount[p.protocol] || 0) + 1;
      }
    });

    if (Object.keys(protocolCount).length === 0) {
      return [
        { name: "TCP", value: 45 },
        { name: "UDP", value: 25 },
        { name: "HTTP", value: 15 },
        { name: "DNS", value: 10 },
        { name: "SSH", value: 3 },
        { name: "OTHER", value: 2 },
      ];
    }

    return Object.entries(protocolCount).map(([name, value]) => ({ name, value }));
  }, [packets]);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-4">Protokol Taqsimoti</h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.[0]) {
                  return (
                    <div className="bg-card border border-border rounded-lg p-2 shadow-xl">
                      <p className="text-xs font-semibold">{payload[0].name}</p>
                      <p className="text-xs text-muted-foreground">{payload[0].value} paket</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.slice(0, 6).map((item, idx) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-xs font-mono">{item.name}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}