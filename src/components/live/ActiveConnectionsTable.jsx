import { cn } from "@/lib/utils";
import moment from "moment";

const statusColor = {
  normal: "text-primary",
  suspicious: "text-chart-3",
  attack: "text-destructive",
};

export default function ActiveConnectionsTable({ packets = [] }) {
  const recent = (packets || []).slice(0, 10);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Faol Ulanishlar</h3>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-muted-foreground font-mono">LIVE</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border bg-secondary/20">
              {["Vaqt", "Manba IP", "Manzil IP", "Port", "Proto", "Hajm", "Holat"].map(h => (
                <th key={h} className="text-left px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((p, idx) => (
              <tr
                key={p.id || idx}
                className={cn(
                  "border-b border-border/30 transition-all",
                  idx === 0 ? "bg-secondary/40 animate-in fade-in duration-300" : "hover:bg-secondary/20"
                )}
              >
                <td className="px-4 py-2 text-muted-foreground/60">{moment(p.timestamp || new Date()).format("HH:mm:ss")}</td>
                <td className="px-4 py-2">{p.source_ip}</td>
                <td className="px-4 py-2">{p.destination_ip}</td>
                <td className="px-4 py-2 text-muted-foreground">{p.port}</td>
                <td className="px-4 py-2">
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">{p.protocol}</span>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{p.size}B</td>
                <td className={cn("px-4 py-2 font-bold uppercase text-[10px]", (p && p.status && statusColor[p.status]) || "text-muted-foreground")}>
                  {p.status || "UNKNOWN"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}