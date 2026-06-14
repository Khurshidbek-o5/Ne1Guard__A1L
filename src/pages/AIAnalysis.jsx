import { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/api/apiClient";
import {
  Brain, Search, ShieldCheck, Zap, AlertCircle, RefreshCw,
  Shield, Activity, Server, AlertTriangle, CheckCircle2, XCircle,
  BarChart2, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import moment from "moment";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { useTranslation } from "react-i18next";

/* ─── helpers ─── */
const PROTOCOL_COLORS = {
  TCP: "#22c55e", UDP: "#38bdf8", HTTP: "#a78bfa",
  HTTPS: "#f472b6", DNS: "#fb923c", SSH: "#facc15",
  FTP: "#ef4444", ICMP: "#94a3b8", ARP: "#34d399",
};
const severityColor = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e" };
const calcRiskScore = (alerts = [], packets = []) => {
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safePackets = Array.isArray(packets) ? packets : [];
  if (!safeAlerts.length && !safePackets.length) return 100;
  const criticals = safeAlerts.filter(a => a && a.severity === "critical").length;
  const highs = safeAlerts.filter(a => a && a.severity === "high").length;
  const attacks = safePackets.filter(p => p && p.status === "attack").length;
  const suspicious = safePackets.filter(p => p && p.status === "suspicious").length;
  const penalty = criticals * 8 + highs * 4 + attacks * 3 + suspicious * 1;
  return Math.max(0, Math.min(100, 100 - penalty));
};

/* ─── sub-components ─── */
function ScoreGauge({ score }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";
  const { t } = useTranslation();
  const label = score >= 80 ? t('common.good') || "YAXSHI" : score >= 60 ? t('common.medium') || "O'RTA" : score >= 40 ? t('common.risky') || "XAVFLI" : t('common.critical') || "KRITIK";
  const r = 58, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative inline-flex items-center justify-center">
        <svg width="140" height="140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(220,16%,12%)" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={r} fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={circ / 4}
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold font-mono" style={{ color }}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <Badge style={{ backgroundColor: color + "20", color, borderColor: color + "40" }}
        className="text-xs font-bold uppercase border">
        {label}
      </Badge>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:-translate-y-0.5 transition-all duration-200 hover:shadow-lg hover:border-border/80">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className={cn("text-2xl font-bold font-mono mt-1", color)}>{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={cn("p-2 rounded-lg bg-secondary", color.replace("text-", "bg-") + "/10")}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      </div>
    </div>
  );
}

function IpAnalysisResult({ ip, packets = [], alerts = [] }) {
  const { t } = useTranslation();
  const safePackets = Array.isArray(packets) ? packets : [];
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const ipPackets = safePackets.filter(p => p && (p.source_ip === ip || p.destination_ip === ip));
  const ipAlerts = safeAlerts.filter(a => a && (a.source_ip === ip || a.target_ip === ip));
  const attackPkts = ipPackets.filter(p => p.status === "attack").length;
  const suspPkts = ipPackets.filter(p => p.status === "suspicious").length;
  const risk = attackPkts > 5 ? "critical" : attackPkts > 2 ? "high" : suspPkts > 3 ? "medium" : "low";
  const riskColors = { critical: "text-destructive", high: "text-chart-5", medium: "text-chart-3", low: "text-primary" };

  if (ipPackets.length === 0 && ipAlerts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary/40 mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">{t('ai_analysis.result_no_activity')}</p>
        <p className="text-xs text-muted-foreground mt-1 font-mono">{ip}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-400">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-accent" />
            <div>
              <p className="font-mono font-bold text-lg">{ip}</p>
              <p className="text-xs text-muted-foreground">{t('ai_analysis.result_title')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("text-xs uppercase font-bold border",
              risk === "critical" ? "bg-destructive/10 text-destructive border-destructive/30" :
              risk === "high"     ? "bg-chart-5/10 text-chart-5 border-chart-5/30" :
              risk === "medium"   ? "bg-chart-3/10 text-chart-3 border-chart-3/30" :
                                   "bg-primary/10 text-primary border-primary/30"
            )}>Risk: {risk}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: t('ai_analysis.total_packets'), value: ipPackets.length, color: "text-primary" },
            { label: t('ai_analysis.attack_packets_short'), value: attackPkts, color: "text-destructive" },
            { label: t('ai_analysis.suspicious'), value: suspPkts, color: "text-chart-3" },
            { label: t('ai_analysis.alerts_short'), value: ipAlerts.length, color: "text-chart-5" },
          ].map(s => (
            <div key={s.label} className="bg-secondary/40 rounded-lg p-3 text-center">
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className={cn("text-xl font-bold font-mono", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Packets table */}
      {ipPackets.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" />
            <h4 className="text-sm font-semibold">{t('ai_analysis.recent_packets')} ({Math.min(ipPackets.length, 10)} / {ipPackets.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  {[t('common.time'), t('common.source'), t('common.destination'), "Port", "Proto", t('common.size'), t('common.status')].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ipPackets.slice(0, 10).map((p, i) => (
                  <tr key={p.id || i} className="border-b border-border/30 hover:bg-secondary/20">
                    <td className="px-4 py-2 text-muted-foreground">{moment(p.timestamp).format("HH:mm:ss")}</td>
                    <td className="px-4 py-2">{p.source_ip}</td>
                    <td className="px-4 py-2">{p.destination_ip}</td>
                    <td className="px-4 py-2 text-muted-foreground">{p.port || "—"}</td>
                    <td className="px-4 py-2">
                      <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">{p.protocol}</span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{p.size}B</td>
                    <td className="px-4 py-2">
                      <span className={cn("font-bold uppercase text-[10px]",
                        p.status === "attack" ? "text-destructive" :
                        p.status === "suspicious" ? "text-chart-3" : "text-primary"
                      )}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts */}
      {ipAlerts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-chart-3" />
            <h4 className="text-sm font-semibold">Bu IP bog'liq alertlar ({ipAlerts.length})</h4>
          </div>
          {ipAlerts.slice(0, 5).map(a => (
            <div key={a.id} className="flex items-start gap-3 bg-secondary/30 rounded-lg p-3">
              <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded border mt-0.5 whitespace-nowrap",
                a.severity === "critical" ? "bg-destructive/10 text-destructive border-destructive/20" :
                a.severity === "high" ? "bg-chart-5/10 text-chart-5 border-chart-5/20" :
                "bg-chart-3/10 text-chart-3 border-chart-3/20"
              )}>{a.severity}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{a.type}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{moment(a.timestamp).fromNow()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function AIAnalysis() {
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const { t } = useTranslation();

  const [packets, setPackets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, a, d] = await Promise.all([
        apiClient.getPackets().catch(() => []),
        apiClient.getAlerts().catch(() => []),
        apiClient.getDevices().catch(() => []),
      ]);
      setPackets(Array.isArray(p) ? p : []);
      setAlerts(Array.isArray(a) ? a : []);
      setDevices(Array.isArray(d) ? d : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* computed */
  const riskScore = useMemo(() => calcRiskScore(alerts, packets), [alerts, packets]);

  const protocolData = useMemo(() => {
    const counts = {};
    const safePackets = Array.isArray(packets) ? packets : [];
    safePackets.forEach(p => { if (p && p.protocol) counts[p.protocol] = (counts[p.protocol] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [packets]);

  const topThreats = useMemo(() => {
    const ipCounts = {};
    const safePackets = Array.isArray(packets) ? packets : [];
    safePackets.filter(p => p && (p.status === "attack" || p.status === "suspicious"))
      .forEach(p => { 
        if (p.source_ip) ipCounts[p.source_ip] = (ipCounts[p.source_ip] || 0) + 1; 
      });
    return Object.entries(ipCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([ip, count]) => ({ ip, count }));
  }, [packets]);

  const alertsBySeverity = useMemo(() => {
    const safeAlerts = Array.isArray(alerts) ? alerts : [];
    const data = ["critical", "high", "medium", "low"].map(s => ({
      name: s, value: safeAlerts.filter(a => a && a.severity === s).length,
    }));
    return data.filter(d => d.value > 0);
  }, [alerts]);

  const recommendations = useMemo(() => {
    const recs = [];
    const safeAlerts = Array.isArray(alerts) ? alerts : [];
    const safePackets = Array.isArray(packets) ? packets : [];
    const safeDevices = Array.isArray(devices) ? devices : [];

    const activeCriticals = safeAlerts.filter(a => a && a.severity === "critical" && a.status === "active").length;
    if (activeCriticals > 0)
      recs.push({ level: "critical", text: `${activeCriticals} ta kritik havfsizlik hodisasi faol — darhol ko'rib chiqing` });
    
    if (topThreats && topThreats.length > 0)
      recs.push({ level: "high", text: `Top tahdid IP: ${topThreats[0]?.ip} — ${topThreats[0]?.count} ta shubhali paket` });
    
    if (safePackets.filter(p => p && (p.protocol === "FTP" || p.protocol === "TELNET")).length > 0)
      recs.push({ level: "medium", text: "Xavfli protokollar (FTP/Telnet) aniqlandi — SFTP/SSH ga o'ting" });
    
    const attackPkts = safePackets.filter(p => p && p.status === "attack").length;
    const attackRate = safePackets.length > 0 ? attackPkts / safePackets.length : 0;
    if (attackRate > 0.05)
      recs.push({ level: "high", text: `Hujum darajasi ${(attackRate * 100).toFixed(1)}% — firewall qoidalarini kuchaytiring` });
    
    if (safeDevices.filter(d => d && d.status === "suspicious").length > 0)
      recs.push({ level: "high", text: `${safeDevices.filter(d => d && d.status === "suspicious").length} ta shubhali qurilma tarmoqda` });
    
    if (recs.length === 0)
      recs.push({ level: "low", text: "Tarmoq holati yaxshi — hozircha kritik tahdidlar aniqlanmadi" });
    return recs;
  }, [alerts, packets, devices, topThreats]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setSearchResult(query.trim());
      setIsSearching(false);
    }, 600);
  };

  const recColors = { critical: "border-destructive/30 bg-destructive/5 text-destructive", high: "border-chart-5/30 bg-chart-5/5 text-chart-5", medium: "border-chart-3/30 bg-chart-3/5 text-chart-3", low: "border-primary/30 bg-primary/5 text-primary" };
  const recIcons = { critical: XCircle, high: AlertCircle, medium: AlertTriangle, low: CheckCircle2 };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent glow-blue">
              <Brain className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{t('ai_analysis.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-14">
            {t('ai_analysis.subtitle')} · {loading ? t('common.loading') : `${packets.length} paket, ${alerts.length} alert, ${devices.length} qurilma`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
          {t('common.refresh')}
        </Button>
      </div>

      {/* IP Search */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-3 flex items-center gap-2">
          <Search className="h-3.5 w-3.5" /> {t('ai_analysis.ip_analysis')}
        </p>
        <div className="flex gap-3 relative z-10">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder={t('ai_analysis.ip_placeholder')}
              className="pl-10 h-11 font-mono"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()} className="h-11 px-6">
            {isSearching ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            {isSearching ? t('ai_analysis.analyzing') : t('ai_analysis.analyze_btn')}
          </Button>
        </div>
        {/* Quick IP hints */}
        {topThreats.length > 0 && !searchResult && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground">{t('ai_analysis.top_threats')}:</span>
            {topThreats.slice(0, 4).map(t => (
              <button
                key={t.ip}
                onClick={() => { setQuery(t.ip); setSearchResult(t.ip); }}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
              >
                {t.ip}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* IP Result */}
      {searchResult && (
        <IpAnalysisResult ip={searchResult} packets={packets} alerts={alerts} />
      )}

      {/* Overview Stats */}
      {!loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Shield}        label={t('ai_analysis.risk_score')}   value={`${riskScore}%`} sub={riskScore >= 80 ? "Tizim xavfsiz" : "Diqqat talab etadi"} color={riskScore >= 80 ? "text-primary" : riskScore >= 60 ? "text-chart-3" : "text-destructive"} />
            <StatCard icon={AlertTriangle} label={t('ai_analysis.active_alerts')}      value={alerts.filter(a => a.status === "active").length} sub={`${alerts.filter(a=>a.severity==="critical").length} ta kritik`} color="text-chart-3" />
            <StatCard icon={Activity}      label={t('ai_analysis.attack_packets')}    value={packets.filter(p => p.status === "attack").length} sub={`${packets.length} ta jami paket`} color="text-destructive" />
            <StatCard icon={Server}        label={t('ai_analysis.online_devices')}  value={devices.filter(d => d.status === "online").length} sub={`${devices.length} ta jami`} color="text-accent" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score gauge + Recommendations */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center gap-4">
                <p className="text-xs text-muted-foreground uppercase font-mono tracking-widest">{t('ai_analysis.overall_security')}</p>
                <ScoreGauge score={riskScore} />
                <div className="w-full text-center">
                  <p className="text-xs text-muted-foreground">
                    {packets.filter(p=>p.status==="attack").length} hujum · {alerts.filter(a=>a.severity==="critical").length} kritik alert
                  </p>
                </div>
              </div>

              {/* Top Threats */}
              {topThreats.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" /> {t('ai_analysis.top_threats')}
                  </h3>
                  {topThreats.map((t, i) => (
                    <button
                      key={t.ip}
                      onClick={() => { setQuery(t.ip); setSearchResult(t.ip); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="w-full flex items-center gap-3 hover:bg-secondary/50 rounded-lg p-2 transition-colors text-left"
                    >
                      <span className="text-xs text-muted-foreground font-mono w-4">{i + 1}</span>
                      <span className="font-mono text-sm flex-1">{t.ip}</span>
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 bg-destructive/5">
                        {t.count} hujum
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Charts */}
            <div className="lg:col-span-2 space-y-4">
              {/* Protocol Distribution */}
              {protocolData.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-accent" /> {t('ai_analysis.protocol_distribution')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={protocolData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                          {protocolData.map((entry) => (
                            <Cell key={entry.name} fill={PROTOCOL_COLORS[entry.name] || "#64748b"} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => active && payload?.[0] ? (
                            <div className="bg-card border border-border rounded px-2 py-1 text-xs">
                              <p className="font-bold">{payload[0].name}</p>
                              <p className="text-muted-foreground">{payload[0].value} paket</p>
                            </div>
                          ) : null}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col justify-center gap-1.5">
                      {protocolData.slice(0, 6).map(d => (
                        <div key={d.name} className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PROTOCOL_COLORS[d.name] || "#64748b" }} />
                          <span className="text-xs font-mono text-muted-foreground flex-1">{d.name}</span>
                          <span className="text-xs font-bold">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Alerts by severity bar chart */}
              {alertsBySeverity.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-chart-3" /> {t('ai_analysis.alerts_analysis')}
                  </h3>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={alertsBySeverity} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke="hsl(220,16%,10%)" vertical={false} />
                      <XAxis dataKey="name" fontSize={10} fontFamily="JetBrains Mono" stroke="hsl(215,16%,30%)" tickLine={false} />
                      <YAxis fontSize={10} fontFamily="JetBrains Mono" stroke="hsl(215,16%,30%)" tickLine={false} axisLine={false} />
                      <Tooltip
                        content={({ active, payload }) => active && payload?.[0] ? (
                          <div className="bg-card border border-border rounded px-2 py-1 text-xs">
                            <p className="font-mono">{payload[0].payload.name}: <strong>{payload[0].value}</strong></p>
                          </div>
                        ) : null}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {alertsBySeverity.map(entry => (
                          <Cell key={entry.name} fill={severityColor[entry.name] || "#64748b"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> {t('ai_analysis.ai_recommendations')}
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30 ml-1">{t('ai_analysis.based_on_data')}</Badge>
            </h3>
            <div className="space-y-2">
              {recommendations.map((rec, i) => {
                const Icon = recIcons[rec.level];
                return (
                  <div key={i} className={cn("flex items-start gap-3 p-3 rounded-lg border", recColors[rec.level])}>
                    <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-sm">{rec.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        </div>
      )}
    </div>
  );
}