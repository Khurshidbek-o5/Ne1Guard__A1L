import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useMemo } from "react";
import moment from "moment";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
      <p className="text-[10px] text-muted-foreground font-mono mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-semibold" style={{ color: entry.color }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function LiveTrafficChart({ history = [] }) {
  const data = useMemo(() => {
    const safeHistory = Array.isArray(history) ? history : [];
    return safeHistory.slice(-40).map(h => ({
      t: moment(h.t).format("HH:mm:ss"),
      "Net IN": Math.round(h.network_in),
      "Net OUT": Math.round(h.network_out),
      "Paketlar": h.packets,
    }));
  }, [history]);

  const maxIn = data.length ? Math.max(...data.map(d => d["Net IN"])) : 0;
  const avgIn = data.length ? Math.round(data.reduce((s, d) => s + d["Net IN"], 0) / data.length) : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold">Real-Time Network Traffic</h3>
          <p className="text-[11px] text-muted-foreground font-mono">
            Peak: <span className="text-chart-3">{maxIn} Mb/s</span>
            &nbsp;·&nbsp;Avg: <span className="text-primary">{avgIn} Mb/s</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          {[
            { label: "Net IN", color: "#22c55e" },
            { label: "Net OUT", color: "#38bdf8" },
            { label: "Paketlar", color: "#a78bfa" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[10px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <defs>
            {[
              { id: "gin", color: "#22c55e" },
              { id: "gout", color: "#38bdf8" },
              { id: "gpkt", color: "#a78bfa" },
            ].map(g => (
              <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={g.color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={g.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="hsl(220, 16%, 10%)" vertical={false} />
          <XAxis dataKey="t" stroke="hsl(215,16%,25%)" fontSize={9} fontFamily="JetBrains Mono" interval={9} tickLine={false} />
          <YAxis stroke="hsl(215,16%,25%)" fontSize={9} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} width={30} />
          <Tooltip content={CustomTooltip} />
          <ReferenceLine y={avgIn} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.3} />
          <Area isAnimationActive={false} type="monotone" dataKey="Net IN" stroke="#22c55e" fill="url(#gin)" strokeWidth={2} />
          <Area isAnimationActive={false} type="monotone" dataKey="Net OUT" stroke="#38bdf8" fill="url(#gout)" strokeWidth={2} />
          <Area isAnimationActive={false} type="monotone" dataKey="Paketlar" stroke="#a78bfa" fill="url(#gpkt)" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}