import { cn } from "@/lib/utils";
import moment from "moment";
import { ShieldAlert, ShieldCheck, Globe } from "lucide-react";

const typeLabels = {
  'PORT_SCAN': "Port Scan",
  'BRUTE_FORCE': "Brute Force",
  'ARP_SPOOFING': "ARP Spoofing",
  'DDOS_ATTACK': "DDoS Attack",
  'DATA_EXFILTRATION': "Data Exfiltration",
  'INSECURE_PROTOCOL': "Insecure Protocol",
  'NETWORK_ATTACK': "Network Attack",
  'ANOMALY': "Anomaly",
};

const severityStyles = {
  critical: "border-l-destructive text-destructive",
  high: "border-l-chart-5 text-chart-5",
  medium: "border-l-chart-3 text-chart-3",
  low: "border-l-accent text-accent",
};

export default function ThreatFeed({ threats = [] }) {
  const safethreats = threats || [];
  if (!safethreats.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <ShieldCheck className="h-8 w-8 text-primary/30 mb-2" />
        <p className="text-xs">Tahdidlar aniqlanmadi</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-72 overflow-y-auto">
      {safethreats.slice(0, 15).map((threat, idx) => (
        <div
          key={threat.id ?? idx}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-r-lg border-l-2 bg-card hover:bg-secondary/50 transition-all",
            idx === 0 ? "animate-in fade-in slide-in-from-top-1 duration-300" : "",
            (threat && threat.severity && severityStyles[threat.severity]) || "border-l-border text-muted-foreground"
          )}
        >
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase">{(threat && threat.type && typeLabels[threat.type]) || "Noma'lum Hodisa"}</span>
              {threat && threat.blocked ? (
                <span className="text-[9px] bg-primary/10 text-primary px-1 rounded">BLOCKED</span>
              ) : (
                <span className="text-[9px] bg-destructive/10 text-destructive px-1 rounded">ACTIVE</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono text-muted-foreground">{threat.source_ip}</span>
              <span className="text-[10px] text-muted-foreground/50">→</span>
              <span className="text-[10px] font-mono text-muted-foreground">{threat.target_ip}</span>
              {threat.country && (
                <span className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5">
                  <Globe className="h-2.5 w-2.5" />{threat.country}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={cn("text-xs font-bold font-mono", threat.risk_score >= 80 ? "text-destructive" : "text-chart-3")}>
              {threat.risk_score}%
            </div>
            <div className="text-[9px] text-muted-foreground">{moment(threat.timestamp).fromNow()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}