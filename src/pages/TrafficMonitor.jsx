import { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import { Activity, Filter, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import moment from "moment";
import SimulateTrafficDialog from "../components/traffic/SimulateTrafficDialog";
import { useTranslation } from "react-i18next";

const statusStyles = {
  normal: "bg-primary/10 text-primary border-primary/20",
  suspicious: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  attack: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function TrafficMonitor() {
  const { t } = useTranslation();
  const [packets, setPackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProtocol, setFilterProtocol] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showSimulate, setShowSimulate] = useState(false);

  const loadPackets = () => {
    setLoading(true);
    apiClient.getPackets().then(data => {
      setPackets(data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load packets:", err);
      setLoading(false);
    });
  };

  useEffect(() => { loadPackets(); }, []);

  const filtered = packets.filter(p => {
    if (filterProtocol !== "all" && p.protocol !== filterProtocol) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-accent" />
            {t('traffic.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('traffic.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadPackets}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            {t('common.refresh')}
          </Button>
          <Button size="sm" onClick={() => setShowSimulate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t('traffic.simulate')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t('common.filter')}</span>
        </div>
        <Select value={filterProtocol} onValueChange={setFilterProtocol}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder={t('traffic.protocol')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="TCP">TCP</SelectItem>
            <SelectItem value="UDP">UDP</SelectItem>
            <SelectItem value="HTTP">HTTP</SelectItem>
            <SelectItem value="HTTPS">HTTPS</SelectItem>
            <SelectItem value="DNS">DNS</SelectItem>
            <SelectItem value="SSH">SSH</SelectItem>
            <SelectItem value="ICMP">ICMP</SelectItem>
            <SelectItem value="ARP">ARP</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="normal">{t('common.status_normal')}</SelectItem>
            <SelectItem value="suspicious">{t('common.status_suspicious')}</SelectItem>
            <SelectItem value="attack">{t('common.status_attack')}</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} {t('traffic.packets_found')}</span>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('common.time')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('common.source')} IP</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('common.destination')} IP</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Port</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('common.protocol')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('common.size')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">{t('common.loading')}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">{t('common.not_found')}</td></tr>
              ) : (
                filtered.map(packet => (
                  <tr key={packet.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{moment(packet.timestamp).format("HH:mm:ss")}</td>
                    <td className="px-4 py-3 font-mono text-xs">{packet.source_ip}</td>
                    <td className="px-4 py-3 font-mono text-xs">{packet.destination_ip}</td>
                    <td className="px-4 py-3 font-mono text-xs">{packet.port || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] font-mono">{packet.protocol}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{packet.size}B</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded border", statusStyles[packet.status] || "bg-secondary text-muted-foreground border-border")}>
                        {packet.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SimulateTrafficDialog open={showSimulate} onOpenChange={setShowSimulate} onComplete={loadPackets} />
    </div>
  );
}