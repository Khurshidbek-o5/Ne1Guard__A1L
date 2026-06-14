import { useState, useEffect, useMemo, useCallback } from "react";
import { apiClient } from "../api/apiClient";
import { useWebSocket } from "../hooks/useWebSocket";
import { useSimulation } from "../hooks/useSimulation";
import { useAuth } from "@/lib/AuthContext";
import { useNotificationSound } from "../hooks/useNotificationSound";
import SystemHealthGauge from "../components/live/SystemHealthGauge";
import LiveTrafficChart from "../components/live/LiveTrafficChart";
import LiveLogStream from "../components/live/LiveLogStream";
import ThreatFeed from "../components/live/ThreatFeed";
import TopMetricsBar from "../components/live/TopMetricsBar";
import { Button } from "@/components/ui/button";
import { Pause, Play, Activity, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { user } = useAuth();
  const { isLive, setIsLive } = useSimulation();
  const { isConnected, messages } = useWebSocket();
  const { t } = useTranslation();
  const { playBeep } = useNotificationSound();

  const [stats, setStats] = useState(null);
  const [livePackets, setLivePackets] = useState([]);
  const [liveThreats, setLiveThreats] = useState([]);
  const [liveLogs, setLiveLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Data Fetching Logic
  const loadDashboardData = useCallback(async (isInitial = false) => {
    try {
      const data = await apiClient.getStats();
      if (data?.overview) {
        setStats(data);
      }

      if (isInitial) {
        // Fetch active alerts to seed threat feed
        const alerts = await apiClient.getAlerts();
        if (Array.isArray(alerts)) {
          setLiveThreats(alerts.map(a => ({
            ...a,
            blocked: a.status === 'resolved',
            risk_score: a.risk_score || 50
          })));
        }

        // Fetch recent packets
        const packets = await apiClient.getPackets();
        setLivePackets(Array.isArray(packets) ? packets.slice(0, 50) : []);
      }
    } catch (err) {
      console.error("❌ Dashboard data fetch error:", err);
      if (isInitial) {
        toast({
          title: t('dashboard.error_title') || "Dashboard Error",
          description: err.message || t('dashboard.error_desc'),
          variant: "destructive"
        });
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [t]);

  // Initial Load
  useEffect(() => {
    loadDashboardData(true);
    const interval = setInterval(() => loadDashboardData(false), 10000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Handle Real-time Updates via WS
  useEffect(() => {
    if (!messages.length) return;
    
    const latestMsg = messages[0];

    if (latestMsg.type === 'NEW_ALERT') {
      // Play alert sound
      playBeep(880, 0.15, 0.1);

      // Update threats
      const newThreat = { 
        ...latestMsg.payload, 
        blocked: false, 
        risk_score: latestMsg.payload.risk_score || 70 
      };
      setLiveThreats(prev => [newThreat, ...prev].slice(0, 50));

      // Update logs
      setLiveLogs(prev => [{
        id: Date.now(),
        level: latestMsg.payload.severity === 'critical' ? 'ERROR' : 'WARN',
        message: latestMsg.payload.description,
        timestamp: new Date(),
        source: 'IDS-Engine'
      }, ...prev].slice(0, 40));
    }
  }, [messages, playBeep]);

  // Derived Metrics
  const metrics = useMemo(() => {
    if (!stats) return { 
      cpu: 0, memory: 0, network_in: 0, network_out: 0, 
      packets_per_sec: 0, connections: 0, threats_blocked: 0, 
      uptime_hours: 0, latency: 0, packet_loss: 0 
    };

    const { overview = {}, hourly_traffic = [] } = stats;
    const lastHour = hourly_traffic.length ? hourly_traffic[hourly_traffic.length - 1] : { total: 0 };
    
    return {
      cpu: 30 + ((overview.total_packets || 0) % 50),
      memory: 45 + ((overview.active_alerts || 0) % 30),
      network_in: ((overview.total_packets || 0) * 0.5) % 1000,
      network_out: ((overview.total_packets || 0) * 0.3) % 1000,
      packets_per_sec: lastHour.total || 0,
      connections: (overview.online_devices || 0) * 15,
      threats_blocked: Math.max(0, (overview.total_alerts || 0) - (overview.active_alerts || 0)),
      uptime_hours: 120.4,
      latency: 12,
      packet_loss: 0.1,
    };
  }, [stats]);

  const metricsHistory = useMemo(() => {
    if (!stats?.hourly_traffic || !Array.isArray(stats.hourly_traffic)) return [];
    
    return stats.hourly_traffic.map((h, i) => ({
      t: Date.now() - (24 - i) * 3600000,
      cpu: 45, 
      memory: 50,
      network_in: (h.total || 0) * 10,
      network_out: (h.total || 0) * 5,
      packets: (h.total || 0) * 2
    })).slice(-20);
  }, [stats]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeAlertsCount = (messages || []).filter(m => m.type === 'NEW_ALERT').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header Section */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70">
              NetGuard AI
            </h1>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-2">
            <span className="opacity-50">PROD_ENV</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>192.168.1.0/24</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className={cn(
              "font-bold px-1.5 py-0.5 rounded-[2px]",
              stats?.overview?.threat_score >= 80 ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20"
            )}>
              SYS_STATUS: {stats?.overview?.threat_score >= 80 ? t('dashboard.secure') : t('dashboard.warning')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badges */}
          <StatusBadge 
            icon={isConnected ? "bg-primary" : "bg-destructive"} 
            label={isConnected ? t('dashboard.ws_connected') : t('dashboard.ws_disconnected')}
            isActive={isConnected}
          />
          <StatusBadge 
            icon={isLive ? "bg-primary" : "bg-muted-foreground"} 
            label={isLive ? t('dashboard.sim_live') : t('dashboard.sim_paused')}
            isActive={isLive}
          />

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative h-8 w-8 rounded-full bg-background border-border hover:border-primary/50 transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground hover:text-primary" />
                {activeAlertsCount > 0 && (
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 border-border/50 bg-[#0b1121]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-secondary/20">
                <p className="text-xs font-bold font-mono uppercase tracking-widest text-foreground">{t('dashboard.notifications')}</p>
                <div className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-mono font-bold">
                  {activeAlertsCount}
                </div>
              </div>
              <ScrollArea className="h-72">
                <div className="p-2 space-y-1">
                  {activeAlertsCount === 0 ? (
                    <div className="text-center py-10 text-xs text-muted-foreground font-mono">
                      {t('dashboard.no_messages')}
                    </div>
                  ) : (
                    messages.filter(m => m.type === 'NEW_ALERT').map((msg, i) => (
                      <NotificationItem key={i} msg={msg} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Admin Controls */}
          {user && (user.role === 'developer' || user.role === 'admin') && (
            <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-lg border border-border/50">
              <ControlButton 
                isActive={isLive} 
                icon={<Play className="h-3 w-3 mr-1" />} 
                label={t('dashboard.run')} 
                onClick={() => setIsLive(true)}
                activeClass="bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.3)]"
              />
              <ControlButton 
                isActive={!isLive} 
                icon={<Pause className="h-3 w-3 mr-1" />} 
                label={t('dashboard.stop')} 
                onClick={() => setIsLive(false)}
                activeClass="text-muted-foreground hover:text-destructive"
              />
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <TopMetricsBar
        metrics={metrics}
        totalPackets={stats?.overview?.total_packets || 0}
        alertCount={stats?.overview?.active_alerts || 0}
        threats={liveThreats}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 card-hover">
          <LiveTrafficChart history={metricsHistory} />
        </div>
        <div className="xl:col-span-1 card-hover">
          <SystemHealthGauge metrics={metrics} history={metricsHistory} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardSection title={t('dashboard.threat_intel')} color="destructive">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-destructive/10 border border-destructive/20 ml-auto">
            <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-ping" />
            <span className="text-[10px] text-destructive font-mono font-bold">
              {liveThreats.filter(t => !t.blocked).length} {t('dashboard.active')}
            </span>
          </div>
          <ThreatFeed threats={liveThreats} />
        </DashboardSection>

        <DashboardSection title={t('dashboard.system_logs')} color="primary">
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] text-muted-foreground font-mono">{liveLogs.length} {t('dashboard.recent_entries')}</span>
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </div>
          <LiveLogStream logs={liveLogs} maxHeight={300} />
        </DashboardSection>
      </div>
    </div>
  );
}

// Internal Sub-components for better organization
function StatusBadge({ icon, label, isActive }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold transition-all shadow-[0_0_15px_rgba(34,197,94,0.15)]",
      isActive ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"
    )}>
      <div className={cn("h-2 w-2 rounded-full", icon, isActive && "animate-pulse")} />
      {label}
    </div>
  );
}

function NotificationItem({ msg }) {
  const { t } = useTranslation();
  return (
    <div className="px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group cursor-default">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs font-bold text-destructive truncate">
          {msg.payload?.algorithm || t('dashboard.notifications_title')}
        </p>
        <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap">
          {new Date().toLocaleTimeString(t('common.locale_tag'), { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
        {msg.payload?.description || msg.payload?.message || t('dashboard.unknown_threat')}
      </p>
    </div>
  );
}

function ControlButton({ isActive, icon, label, onClick, activeClass }) {
  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      className={cn(
        "h-7 px-3 text-[10px] font-bold font-mono transition-all",
        isActive ? activeClass : "text-muted-foreground hover:text-primary"
      )}
    >
      {icon} {label}
    </Button>
  );
}

function DashboardSection({ title, color, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 card-hover relative overflow-hidden flex flex-col h-full">
      <div className={cn(
        "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-transparent to-transparent opacity-50",
        color === 'destructive' ? "via-destructive" : "via-primary"
      )} />
      <div className="flex items-center mb-4">
        <h3 className={cn("text-sm font-semibold", color === 'destructive' ? "text-destructive" : "text-foreground")}>
          {title}
        </h3>
        {children[0]}
      </div>
      <div className="flex-1 min-h-0">
        {children[1]}
      </div>
    </div>
  );
}