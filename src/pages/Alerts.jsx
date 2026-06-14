import { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import { AlertTriangle, CheckCircle, Plus, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import moment from "moment";
import AddAlertDialog from "../components/alerts/AddAlertDialog";
import AlertDetailDialog from "../components/alerts/AlertDetailDialog";
import { useTranslation } from "react-i18next";

const severityStyles = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  medium: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  low: "bg-accent/10 text-accent border-accent/20",
};

const statusStyles = {
  active: "bg-destructive/10 text-destructive",
  investigating: "bg-chart-3/10 text-chart-3",
  resolved: "bg-primary/10 text-primary",
  false_positive: "bg-muted text-muted-foreground",
};

export default function Alerts() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const loadAlerts = () => {
    setLoading(true);
    apiClient.getAlerts().then(data => {
      setAlerts(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load alerts:", err);
      setAlerts([]);
      setLoading(false);
    });
  };

  useEffect(() => { loadAlerts(); }, []);

  const filtered = alerts.filter(a => {
    if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-chart-3" />
            {t('alerts_page.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('alerts_page.subtitle')} · {alerts.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAlerts}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            {t('common.refresh')}
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t('alerts_page.new_alert')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {["critical", "high", "medium", "low"].map(sev => {
          const count = alerts.filter(a => a.severity === sev && a.status === "active").length;
          return (
            <div key={sev} className={cn(
              "rounded-lg border p-3 transition-all duration-300",
              "hover:-translate-y-1 hover:shadow-lg",
              severityStyles[sev]
            )}>
              <p className="text-xs font-medium uppercase">{sev}</p>
              <p className="text-xl font-bold font-mono mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder={t('alerts_page.severity')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="active">{t('common.status_active')}</SelectItem>
            <SelectItem value="investigating">{t('common.status_investigating')}</SelectItem>
            <SelectItem value="resolved">{t('common.status_resolved')}</SelectItem>
            <SelectItem value="false_positive">{t('common.status_false_positive')}</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} {t('alerts_page.alerts_count')}</span>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-primary/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t('alerts_page.no_alerts')}</p>
          </div>
        ) : (
          filtered.map(alert => (
            <div
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className={cn(
                "bg-card border border-border rounded-xl p-4 transition-all duration-300 cursor-pointer",
                "hover:-translate-y-0.5 hover:shadow-md hover:border-border/80"
              )}
            >
              <div className="flex items-start gap-4">
                <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded border mt-0.5 whitespace-nowrap", severityStyles[alert.severity])}>
                  {alert.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{alert.type}</h3>
                    <Badge variant="outline" className={cn("text-[10px]", statusStyles[alert.status])}>
                      {alert.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-[10px] font-mono text-muted-foreground">{t('alerts_page.source')} {alert.source_ip || 'Internal'}</span>
                    {alert.target_ip && <span className="text-[10px] font-mono text-muted-foreground">{t('alerts_page.target')} {alert.target_ip}</span>}
                    {alert.risk_score && <span className="text-[10px] font-mono text-muted-foreground">{t('alerts_page.risk')} {alert.risk_score}%</span>}
                    <span className="text-[10px] text-muted-foreground">{moment(alert.timestamp).fromNow()}</span>
                  </div>
                </div>
                <Eye className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
              </div>
            </div>
          ))
        )}
      </div>

      <AddAlertDialog open={showAdd} onOpenChange={setShowAdd} onCreated={loadAlerts} />
      <AlertDetailDialog 
        alert={selectedAlert} 
        open={!!selectedAlert} 
        onOpenChange={open => !open && setSelectedAlert(null)} 
        onStatusChange={() => {
          loadAlerts();
          setSelectedAlert(null);
        }}
      />
    </div>
  );
}