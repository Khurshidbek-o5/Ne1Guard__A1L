import { cn } from "@/lib/utils";

const statusColor = {
  normal:     "bg-primary/60",
  suspicious: "bg-chart-3/80",
  attack:     "bg-destructive",
};
const protocolColor = {
  TCP: "#22c55e", UDP: "#38bdf8", HTTP: "#a78bfa", HTTPS: "#34d399",
  DNS: "#fb923c", SSH: "#f472b6", ICMP: "#facc15", ARP: "#ef4444",
  FTP: "#818cf8", OTHER: "#6b7280",
};

export default function PacketMatrix({ packets }) {
  const recent = packets.slice(0, 80);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">Packet Matrix</h3>
          <p className="text-[11px] text-muted-foreground">So'nggi 80 paket — real vaqt</p>
        </div>
        <div className="flex items-center gap-3">
          {["normal", "suspicious", "attack"].map(s => (
            <div key={s} className="flex items-center gap-1">
              <div className={cn("h-2 w-2 rounded-sm", statusColor[s])} />
              <span className="text-[10px] text-muted-foreground capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {recent.map((p, idx) => (
          <div
            key={p.id || idx}
            title={`${p.source_ip} → ${p.destination_ip}\n${p.protocol}:${p.port} | ${p.size}B | ${p.status}`}
            className={cn(
              "h-3 w-3 rounded-sm cursor-pointer transition-all hover:scale-150 hover:z-10",
              idx === 0 ? "animate-in zoom-in duration-200" : "",
              statusColor[p.status] || "bg-muted"
            )}
          />
        ))}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 80 - recent.length) }, (_, i) => (
          <div key={`empty-${i}`} className="h-3 w-3 rounded-sm bg-secondary/30" />
        ))}
      </div>
      {/* Protocol legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(protocolColor).slice(0, 8).map(([proto, color]) => (
          <div key={proto} className="flex items-center gap-1">
            <div className="h-1.5 w-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-muted-foreground font-mono">{proto}</span>
          </div>
        ))}
      </div>
    </div>
  );
}