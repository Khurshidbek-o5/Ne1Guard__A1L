import { Monitor, Wifi, Server, Smartphone, Printer, HardDrive, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const deviceIcons = {
  router: Wifi,
  switch: HardDrive,
  server: Server,
  workstation: Monitor,
  mobile: Smartphone,
  printer: Printer,
  iot: Wifi,
  unknown: Monitor,
};

const statusColors = {
  online: "bg-primary",
  offline: "bg-muted-foreground",
  suspicious: "bg-destructive",
};

export default function DevicesList({ devices = [] }) {
  const topDevices = devices.slice(0, 6);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold">Tarmoqdagi Qurilmalar</h3>
        </div>
        <Link to="/devices" className="text-xs text-primary hover:underline flex items-center gap-1">
          Barchasi <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {topDevices.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Qurilmalar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topDevices.map((device) => {
            const Icon = deviceIcons[device.device_type] || Monitor;
            return (
              <div key={device.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{device.hostname}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{device.ip_address}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={cn("h-1.5 w-1.5 rounded-full", statusColors[device.status])} />
                  <span className="text-[10px] text-muted-foreground capitalize">{device.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}