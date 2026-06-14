import { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import {
  Settings, Shield, Bell, Globe, Database, Save, RefreshCw,
  Lock, Eye, EyeOff, AlertTriangle, CheckCircle2, Wifi,
  Server, Activity, HardDrive, Trash2, Download, Users, User, UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "react-i18next";

const API_URL = import.meta.env.VITE_API_URL || '/api';

// These items will be injected directly dynamically inside the component depending on the user role.

/* ───────── TAB PANELS ───────── */

function ProfilePanel({ onSave, loading }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showPass, setShowPass] = useState(false);
  const [newPass, setNewPass] = useState("");

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-primary" /> {t('settings.profile_title')}
        </h3>
        <p className="text-xs text-muted-foreground">{t('settings.profile_desc')}</p>

        <div className="space-y-4 border-t border-border/50 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">{t('common.name')}</Label>
              <Input value={user?.name || ""} disabled className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('common.email')}</Label>
              <Input value={user?.email || ""} disabled className="bg-secondary/30" />
            </div>
          </div>
          <div className="space-y-2">
             <Label className="text-xs">{t('settings.current_role')}</Label>
             <div>
               <Badge variant="outline" className="text-xs font-mono bg-primary/10 text-primary border-primary/20 uppercase tracking-wider">
                 {user?.role || "user"}
               </Badge>
             </div>
          </div>
        </div>

        <div className="border-t border-border/50 pt-4 space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.update_password')}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type={showPass ? "text" : "password"}
              placeholder={t('settings.new_password_placeholder')}
              className="pl-9 pr-10"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">{t('settings.api_demo_note')}</p>
        </div>
      </div>
      <SaveBar onSave={onSave} loading={loading} />
    </div>
  );
}

function GeneralPanel({ settings, setSettings, onSave, loading }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> {t('settings.general_title')}
        </h3>

        <div className="space-y-2">
          <Label className="text-xs">{t('settings.site_name')}</Label>
          <Input
            value={settings.siteName}
            onChange={e => setSettings(s => ({ ...s, siteName: e.target.value }))}
            placeholder="NetGuard AI"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">{t('settings.scan_interval')}</Label>
          <Input
            type="number"
            min="5"
            max="300"
            value={settings.scanInterval}
            onChange={e => setSettings(s => ({ ...s, scanInterval: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">{t('settings.scan_interval_desc')}</p>
        </div>

        <div className="pt-2 space-y-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">{t('settings.dark_mode')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.dark_mode_desc')}</p>
            </div>
            <Switch checked={true} disabled />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">{t('settings.realtime_monitoring')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.realtime_monitoring_desc')}</p>
            </div>
            <Switch
              checked={settings.realtimeEnabled}
              onCheckedChange={v => setSettings(s => ({ ...s, realtimeEnabled: v }))}
            />
          </div>
        </div>
      </div>

      <SaveBar onSave={onSave} loading={loading} />
    </div>
  );
}

function SecurityPanel({ settings, setSettings, onSave, loading }) {
  const { t } = useTranslation();
  const [showPass, setShowPass] = useState(false);
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> {t('settings.security_title')}
        </h3>

        <div className="space-y-4 border-t border-border/50 pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">{t('settings.auto_block')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.auto_block_desc')}</p>
            </div>
            <Switch
              checked={settings.autoBlock}
              onCheckedChange={v => setSettings(s => ({ ...s, autoBlock: v }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">{t('settings.strict_mode')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.strict_mode_desc')}</p>
            </div>
            <Switch
              checked={settings.strictMode}
              onCheckedChange={v => setSettings(s => ({ ...s, strictMode: v }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">{t('settings.ids_enabled')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.ids_enabled_desc')}</p>
            </div>
            <Switch
              checked={settings.idsEnabled}
              onCheckedChange={v => setSettings(s => ({ ...s, idsEnabled: v }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">{t('settings.port_scan_detection')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.port_scan_detection_desc')}</p>
            </div>
            <Switch
              checked={settings.portScanDetection}
              onCheckedChange={v => setSettings(s => ({ ...s, portScanDetection: v }))}
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-chart-3" /> {t('settings.risk_thresholds')}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t('settings.risk_low'), key: "riskLow", default: "30", color: "text-accent" },
            { label: t('settings.risk_med'), key: "riskMed", default: "60", color: "text-chart-3" },
            { label: t('settings.risk_high'), key: "riskHigh", default: "80", color: "text-destructive" },
          ].map(item => (
            <div key={item.key} className="space-y-1.5">
              <Label className={cn("text-xs font-semibold", item.color)}>{item.label}</Label>
              <Input
                type="number" min="0" max="100"
                value={settings[item.key] ?? item.default}
                onChange={e => setSettings(s => ({ ...s, [item.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t('settings.risk_thresholds_desc')}</p>
      </div>

      <SaveBar onSave={onSave} loading={loading} />
    </div>
  );
}

function NotificationsPanel({ settings, setSettings, onSave, loading }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> {t('settings.notification_channels')}
        </h3>

        <div className="space-y-4 border-t border-border/50 pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">{t('settings.notifications')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.notifications_desc')}</p>
            </div>
            <Switch
              checked={settings.notificationsEnabled === 'true'}
              onCheckedChange={v => setSettings(s => ({ ...s, notificationsEnabled: String(v) }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm flex items-center gap-2">
                {t('settings.telegram_bot')}
              </Label>
              <p className="text-xs text-muted-foreground">{t('settings.telegram_bot_desc')}</p>
            </div>
            <Switch
              checked={settings.telegramEnabled === 'true'}
              onCheckedChange={v => setSettings(s => ({ ...s, telegramEnabled: String(v) }))}
              disabled={settings.notificationsEnabled !== 'true'}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm flex items-center gap-2">
                {t('settings.email_notifications')}
              </Label>
              <p className="text-xs text-muted-foreground">{t('settings.email_notifications_desc')}</p>
            </div>
            <Switch
              checked={settings.emailEnabled === 'true'}
              onCheckedChange={v => setSettings(s => ({ ...s, emailEnabled: String(v) }))}
              disabled={settings.notificationsEnabled !== 'true'}
            />
          </div>
        </div>

        <div className="border-t border-border/50 pt-4 space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.telegram_settings')}
          </Label>
          <div className="space-y-2">
            <Label className="text-xs">Bot Token</Label>
            <Input
              placeholder="1234567890:AAF..."
              value={settings.telegramToken || ""}
              onChange={e => setSettings(s => ({ ...s, telegramToken: e.target.value }))}
              disabled={settings.notificationsEnabled !== 'true'}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Chat ID</Label>
            <Input
              placeholder="-100123456789"
              value={settings.telegramChatId || ""}
              onChange={e => setSettings(s => ({ ...s, telegramChatId: e.target.value }))}
              disabled={settings.notificationsEnabled !== 'true'}
            />
          </div>
        </div>

        <div className="border-t border-border/50 pt-4 space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.email_settings')}
          </Label>
          <div className="space-y-2">
            <Label className="text-xs">{t('settings.gmail_address')}</Label>
            <Input
              placeholder="example@gmail.com"
              value={settings.emailUser || ""}
              onChange={e => setSettings(s => ({ ...s, emailUser: e.target.value }))}
              disabled={settings.notificationsEnabled !== 'true'}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t('settings.app_password')}</Label>
            <Input
              type="password"
              placeholder="•••• •••• •••• ••••"
              value={settings.emailPass || ""}
              onChange={e => setSettings(s => ({ ...s, emailPass: e.target.value }))}
              disabled={settings.notificationsEnabled !== 'true'}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t('settings.recipient_email')}</Label>
            <Input
              placeholder="admin@netguard.local"
              value={settings.adminEmail || ""}
              onChange={e => setSettings(s => ({ ...s, adminEmail: e.target.value }))}
              disabled={settings.notificationsEnabled !== 'true'}
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold">{t('settings.notify_levels')}</h3>
        <div className="space-y-3">
          {[
            { label: t('settings.critical_alerts'), key: "notifyCritical", color: "text-destructive" },
            { label: t('settings.high_alerts'),     key: "notifyHigh",     color: "text-chart-5"     },
            { label: t('settings.medium_alerts'),   key: "notifyMedium",   color: "text-chart-3"     },
            { label: t('settings.low_alerts'),      key: "notifyLow",      color: "text-accent"      },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <Label className={cn("text-sm", item.color)}>{item.label}</Label>
              <Switch
                checked={settings[item.key] === 'true'}
                onCheckedChange={v => setSettings(s => ({ ...s, [item.key]: String(v) }))}
                disabled={settings.notificationsEnabled !== 'true'}
              />
            </div>
          ))}
        </div>
      </div>

      <SaveBar onSave={onSave} loading={loading} />
    </div>
  );
}

function UsersPanel() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('netguard_token');
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      toast({ title: t('common.error'), description: t('settings.users_fetch_error') });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, newRole, newApprovalStatus) => {
    try {
      const token = localStorage.getItem('netguard_token');
      const res = await fetch(`${API_URL}/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole, roleApproved: newApprovalStatus })
      });
      if (res.ok) {
        toast({ title: t('common.success'), description: t('settings.role_updated') });
        fetchUsers();
      } else {
        toast({ title: t('common.error'), description: t('settings.role_update_error') });
      }
    } catch (err) {
      toast({ title: t('common.error'), description: t('settings.network_error') });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> {t('settings.all_users')}
        </h3>
        <p className="text-xs text-muted-foreground">{t('settings.users_desc')}</p>
        
        {loading ? (
          <p className="text-xs text-muted-foreground animate-pulse">{t('common.loading')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider">{t('common.name')}</th>
                  <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider">{t('common.email')}</th>
                  <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider">{t('common.status')}</th>
                  <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{u.email}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={cn("text-[10px] font-mono tracking-wider", 
                          u.role === 'developer' ? "bg-accent/10 text-accent border-accent/20" : "bg-primary/10 text-primary border-primary/20",
                          !u.roleApproved && "bg-muted text-muted-foreground border-muted-foreground/20"
                        )}>
                          {u.role}
                        </Badge>
                        <Switch
                          checked={u.roleApproved}
                          onCheckedChange={(checked) => handleRoleChange(u.id, u.role, checked)}
                          className={cn(!u.roleApproved && "opacity-50")}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {u.roleApproved ? t('dashboard.active') : t('common.pending')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <select
                        className="bg-background border border-border/80 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value, u.roleApproved)}
                      >
                        <option value="guest">New / Guest</option>
                        <option value="user">Standard User</option>
                        <option value="printer">Printer Operator</option>
                        <option value="support">IT Support</option>
                        <option value="security">Security Analyst</option>
                        <option value="auditor">Auditor</option>
                        <option value="developer">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DatabasePanel({ dbStats, onRefresh, dbLoading }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      {/* DB Status */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" /> {t('settings.db_status')}
          </h3>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={dbLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-1.5", dbLoading && "animate-spin")} />
            {t('common.refresh')}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary">{t('common.status')}</span>
            </div>
            <p className="text-sm font-bold">{dbStats.status}</p>
          </div>
          <div className="bg-secondary/50 border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">Provider</span>
            </div>
            <p className="text-sm font-bold">PostgreSQL</p>
          </div>
        </div>

        <div className="text-xs font-mono text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2 border border-border/50">
          postgresql://postgres:****@localhost:5432/netguard_al
        </div>
      </div>

      {/* Stats */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" /> {t('settings.table_stats')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Qurilmalar",       value: dbStats.devices,  icon: Wifi,       color: "text-primary" },
            { label: "Paketlar",          value: dbStats.packets,  icon: Activity,   color: "text-accent"  },
            { label: "Ogohlantirishlar",  value: dbStats.alerts,   icon: AlertTriangle, color: "text-chart-3" },
            { label: "Traffic yozuvlar",  value: dbStats.traffic,  icon: HardDrive,  color: "text-chart-5" },
          ].map(item => (
            <div key={item.label} className="bg-secondary/30 border border-border/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className={cn("h-4 w-4", item.color)} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <p className={cn("text-2xl font-bold font-mono", item.color)}>
                {dbLoading ? "..." : (item.value ?? "—")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-muted-foreground" /> {t('common.actions')}
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast({ title: "Tez kunda", description: "Export funksiyasi ishlab chiqilmoqda" })}>
            <Download className="h-4 w-4" /> Ma'lumotlarni export
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => toast({ title: "Xavfli amal", description: "Bu funksiya production'da o'chirilgan", variant: "destructive" })}>
            <Trash2 className="h-4 w-4" /> Eski ma'lumotlarni tozalash
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Prisma ORM • Schema: public • Port: 5432</p>
      </div>
    </div>
  );
}

function SaveBar({ onSave, loading }) {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end gap-3 pt-2">
      <Button variant="outline" onClick={() => window.location.reload()}>
        <RefreshCw className="h-4 w-4 mr-2" /> {t('common.reset')}
      </Button>
      <Button onClick={onSave} disabled={loading}>
        <Save className="h-4 w-4 mr-2" />
        {loading ? t('common.saving') : t('common.save')}
      </Button>
    </div>
  );
}

/* ───────── MAIN PAGE ───────── */
export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbStats, setDbStats] = useState({ status: "Tekshirilmoqda...", devices: null, packets: null, alerts: null, traffic: null });

  const [settings, setSettings] = useState({
    siteName: "NetGuard AI",
    scanInterval: "30",
    notificationsEnabled: "false",
    strictMode: "false",
    autoBlock: "true",
    realtimeEnabled: "true",
    idsEnabled: "true",
    portScanDetection: "true",
    telegramEnabled: "false",
    emailEnabled: "false",
    telegramToken: "",
    telegramChatId: "",
    emailUser: "",
    emailPass: "",
    adminEmail: "",
    notifyCritical: "true",
    notifyHigh: "true",
    notifyMedium: "false",
    notifyLow: "false",
    riskLow: "30",
    riskMed: "60",
    riskHigh: "80",
  });

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('netguard_token');
      const res = await fetch(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Object.keys(data).length > 0) {
          setSettings(s => ({ ...s, ...data }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  useEffect(() => {
    if (isDeveloper) fetchSettings();
  }, []);

  const loadDbStats = async () => {
    setDbLoading(true);
    try {
      const [devices, packets, alerts, traffic, health] = await Promise.all([
        apiClient.getDevices().catch(() => []),
        apiClient.getPackets().catch(() => []),
        apiClient.getAlerts().catch(() => []),
        apiClient.getTraffic().catch(() => []),
        fetch("/api/health").then(r => r.json()).catch(() => ({ db: "error" })),
      ]);
      setDbStats({
        status: health.db === "connected" ? `✅ ${t('common.connected')}` : `❌ ${t('common.disconnected')}`,
        devices: Array.isArray(devices) ? devices.length : 0,
        packets: Array.isArray(packets) ? packets.length : 0,
        alerts: Array.isArray(alerts) ? alerts.length : 0,
        traffic: Array.isArray(traffic) ? traffic.length : 0,
      });
    } catch {
      setDbStats(s => ({ ...s, status: `❌ ${t('common.error')}` }));
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "database") loadDbStats();
  }, [activeTab]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('netguard_token');
      const res = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast({ title: `✅ ${t('settings.save_success')}`, description: t('settings.save_success_desc') });
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      toast({ title: "❌ Xatolik", description: "Sozlamalarni saqlashda xato yuz berdi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sharedProps = { settings, setSettings, onSave: handleSave, loading };

  const isDeveloper = user?.role === 'developer';
  const isSupport = user?.role === 'support';

  const NAV_ITEMS = [
    { id: "profile",       label: "Mening Profilim",    icon: UserCircle },
    // Only developer or support can see these
    ...((isDeveloper || isSupport) ? [
      { id: "general",       label: "Tizim: Umumiy",       icon: Settings },
    ] : []),
    // Only developer can see security, users, database
    ...(isDeveloper ? [
      { id: "security",      label: "Tizim: Xavfsizlik",   icon: Shield },
      { id: "users",         label: "Foydalanuvchilar",    icon: Users },
    ] : []),
    // Developer or support for notifications
    ...((isDeveloper || isSupport) ? [
      { id: "notifications", label: "Bildirishnomalar",    icon: Bell },
    ] : []),
    // Only developer for database
    ...(isDeveloper ? [
      { id: "database",      label: "Ma'lumotlar bazasi",  icon: Database },
    ] : [])
  ];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{isDeveloper ? t('settings.management_title') : t('settings.profile_title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isDeveloper 
            ? t('settings.management_desc')
            : t('settings.profile_desc_short')
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px,1fr] gap-8">
        {/* Sidebar Navigation */}
        <div className="space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left",
                activeTab === item.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
              )}
            >
              <item.icon className={cn("h-4 w-4", activeTab === item.id ? "text-primary" : "text-muted-foreground")} />
              {item.label}
              {activeTab === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile"       && <ProfilePanel       onSave={handleSave} loading={loading} />}

          {/* Render system management panels only if user is developer */}
          {isDeveloper && activeTab === "general"       && <GeneralPanel       {...sharedProps} />}
          {isDeveloper && activeTab === "security"      && <SecurityPanel      {...sharedProps} />}
          {isDeveloper && activeTab === "users"         && <UsersPanel         />}
          {isDeveloper && activeTab === "notifications" && <NotificationsPanel {...sharedProps} />}
          {isDeveloper && activeTab === "database"      && <DatabasePanel dbStats={dbStats} onRefresh={loadDbStats} dbLoading={dbLoading} />}
        </div>
      </div>
    </div>
  );
}