import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import moment from "moment";

const severityStyles = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  medium: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  low: "bg-accent/10 text-accent border-accent/20",
};

const attackTypeLabels = {
  brute_force: "Brute Force",
  port_scan: "Port Scanning",
  arp_spoofing: "ARP Spoofing",
  ddos: "DDoS",
  malware: "Malware",
  anomaly: "Anomaliya",
  other: "Boshqa",
};

export default function RecentAlerts({ alerts = [] }) {
  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-chart-3" />
          <h3 className="text-sm font-semibold">So'nggi Ogohlantirishlar</h3>
        </div>
        <Link to="/alerts" className="text-xs text-primary hover:underline flex items-center gap-1">
          Barchasi <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {recentAlerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6 text-primary/40" />
          </div>
          <p className="text-sm text-muted-foreground">Hozircha ogohlantirish yo'q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <span className={cn(
                "text-[10px] font-bold uppercase px-2 py-0.5 rounded border",
                severityStyles[alert.severity]
              )}>
                {alert.severity}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {attackTypeLabels[alert.attack_type] || alert.attack_type}
                </p>
                <p className="text-xs text-muted-foreground font-mono">{alert.source_ip}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {moment(alert.created_date).fromNow()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}