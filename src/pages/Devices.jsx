import { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import { Monitor, Plus, Wifi, Server, Smartphone, Printer, HardDrive, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import AddDeviceDialog from "../components/devices/AddDeviceDialog";
import { useAuth } from "@/lib/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useTranslation } from "react-i18next";

const deviceIcons = {
  router: Wifi, switch: HardDrive, server: Server,
  workstation: Monitor, mobile: Smartphone, printer: Printer,
  iot: Wifi, unknown: Monitor,
};

const statusColors = {
  online: "bg-primary text-primary-foreground",
  offline: "bg-muted text-muted-foreground",
  suspicious: "bg-destructive text-destructive-foreground",
};

const riskColors = {
  safe: "text-primary",
  low: "text-accent",
  medium: "text-chart-3",
  high: "text-destructive",
};

export default function Devices() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { messages } = useWebSocket();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadDevices = () => {
    setLoading(true);
    apiClient.getDevices().then(data => {
      setDevices(data);
      setLoading(false);
    }).catch(err => {
      console.error(t('settings.users_fetch_error'), err);
      setLoading(false);
    });
  };

  useEffect(() => { loadDevices(); }, []);

  // Listen for WebSocket DEVICE_STATUS_UPDATE events
  useEffect(() => {
    if (messages.length > 0) {
      const msg = messages[0];
      if (msg.type === 'DEVICE_STATUS_UPDATE') {
        const updatedDevice = msg.payload;
        setDevices(prev => 
          prev.map(d => d.id === updatedDevice.id ? { ...d, status: updatedDevice.status, last_seen: updatedDevice.last_seen } : d)
        );
      }
    }
  }, [messages]);

  const onlineCount = devices.filter(d => d.status === "online").length;
  const suspiciousCount = devices.filter(d => d.status === "suspicious").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Monitor className="h-6 w-6 text-accent" />
            {t('settings.title_db')}
          </h1>
          {user?.role !== 'developer' ? (
             <p className="text-sm text-destructive mt-1 font-semibold">{t('common.no_permission')}</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              {onlineCount} {t('common.online')} · {suspiciousCount > 0 ? `${suspiciousCount} ${t('ai_analysis.suspicious')}` : t('settings.all_safe')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadDevices}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            {t('common.refresh')}
          </Button>
          {user?.role === 'developer' && (
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('settings.add_device')}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      ) : user?.role !== 'developer' ? (
        <div className="text-center py-20 border border-dashed border-destructive/30 rounded-2xl bg-destructive/5">
           <Shield className="h-12 w-12 text-destructive/40 mx-auto mb-4" />
           <h2 className="text-lg font-bold text-destructive">{t('common.access_denied')}</h2>
           <p className="text-muted-foreground mt-1">{t('settings.no_permission_desc')}</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-16">
          <Monitor className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{t('settings.not_found')}</p>
          {user?.role === 'developer' && (
            <Button size="sm" className="mt-4" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('settings.add_first_device')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => {
            const Icon = deviceIcons[device.device_type] || Monitor;
            return (
              <div key={device.id} className={cn(
                "bg-card border border-border rounded-xl p-5 transition-all duration-300 group",
                "hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20"
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{device.hostname || 'Unknown'}</h3>
                      <p className="text-xs font-mono text-muted-foreground">{device.ip_address}</p>
                    </div>
                  </div>
                  <Badge className={cn("text-[10px]", statusColors[device.status])}>
                    {device.status}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('settings.last_activity')}</span>
                    <span className="font-mono text-[10px]">
                      {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : t('common.unknown')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('common.mac')}</span>
                    <span className="font-mono">{device.mac_address || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('common.type')}</span>
                    <span className="capitalize">{device.device_type}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('common.risk')}</span>
                    <span className={cn("font-medium capitalize", riskColors[device.risk_level])}>{device.risk_level}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddDeviceDialog open={showAdd} onOpenChange={setShowAdd} onComplete={loadDevices} />
    </div>
  );
}