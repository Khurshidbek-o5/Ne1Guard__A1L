import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

export default function MiniSparkline({ data = [], dataKey, color = "#22c55e", height = 50 }) {
  const safeData = Array.isArray(data) ? data : [];
  const chartData = safeData.slice(-20).map((v, i) => ({ i, v: typeof v === "object" ? v[dataKey] : v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          content={({ active, payload }) => active && payload?.[0] ? (
            <div className="bg-card border border-border rounded px-2 py-1 text-xs font-mono">
              {typeof payload[0].value === "number" ? payload[0].value.toFixed(1) : payload[0].value}
            </div>
          ) : null}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}