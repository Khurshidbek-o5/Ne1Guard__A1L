import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Activity, AlertTriangle, Server,
  Brain, Settings, Menu, X, Shield, LogOut,
  Wifi, Clock, ChevronRight, Radio, Network
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import LanguageSwitcher from "./LanguageSwitcher";

const navItems = [
  { path: "/",            label: "common.dashboard",       icon: LayoutDashboard, tag: null, roles: ['developer', 'security', 'support', 'user', 'printer', 'auditor', 'guest'] },
  { path: "/traffic",     label: "common.traffic",         icon: Activity,        tag: null, roles: ['developer', 'support', 'user', 'security'] },
  { path: "/alerts",      label: "common.alerts",          icon: AlertTriangle,   tag: null, roles: ['developer', 'support', 'security', 'auditor'] },
  { path: "/devices",     label: "common.devices",         icon: Server,          tag: null, roles: ['developer', 'auditor'] },
  { path: "/printer",     label: "common.printer",         icon: LayoutDashboard, tag: null, roles: ['developer', 'printer'] },
  { path: "/map",         label: "common.map",             icon: Network,         tag: null, roles: ['developer', 'support'] },
  { path: "/ai-analysis", label: "common.ai_analysis",     icon: Brain,           tag: null, roles: ['developer', 'support', 'security'] },
];

/* Clock */
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
      {time.toLocaleTimeString((i18n?.language === 'uz') ? "uz-UZ" : "en-US", { hour12: false })}
    </span>
  );
}

/* Animated status dot */
function StatusDot({ color = "bg-primary" }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-50", color)} />
      <span className={cn("relative inline-flex rounded-full h-2 w-2", color)} />
    </span>
  );
}

/* Top strip bar */
function TopStrip() {
  return (
    <div className="h-8 topbar-gradient flex items-center justify-between px-4 shrink-0 hidden md:flex">
      <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground/70">
        <div className="flex items-center gap-1.5">
          <StatusDot color="bg-primary" />
          <span className="text-primary/80">SYS ONLINE</span>
        </div>
        <span className="text-border">│</span>
        <span>192.168.1.0/24</span>
        <span className="text-border">│</span>
        <span>NETGUARD v2.0</span>
        <span className="text-border">│</span>
        <span>TLS 1.3 ENC</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground/70">
        <LanguageSwitcher />
        <div className="flex items-center gap-1.5">
          <Radio className="h-3 w-3 text-primary/60" />
          <span>MONITOR ACTIVE</span>
        </div>
        <LiveClock />
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();
  const { t } = useTranslation();

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Top status strip (desktop) ── */}
      <TopStrip />

      <div className="flex flex-1 min-h-0">

        {/* ── Mobile header ── */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card/40 backdrop-blur-md sticky top-0 z-30">
          <Link to="/" className="flex items-center gap-2.5" onClick={closeSidebar}>
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center glow-green">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-sm">
              NetGuard<span className="text-primary font-mono">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setIsSidebarOpen(v => !v)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile backdrop ── */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-background/70 backdrop-blur-sm z-40 md:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* ════════════════════════════
            SIDEBAR
        ════════════════════════════ */}
        <aside className={cn(
          "fixed md:sticky top-0 left-0 h-screen w-[220px] flex flex-col z-50",
          "transition-transform duration-300 ease-in-out",
          "border-r border-border/60",
          /* Deep sidebar bg with subtle green gradient at top */
          "bg-[hsl(222,28%,4%)]",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
          style={{
            backgroundImage: "linear-gradient(180deg, rgba(34,197,94,0.04) 0%, transparent 30%)",
          }}
        >
          {/* ── Logo ── */}
          <div className="px-5 py-5 border-b border-border/50 hidden md:flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center glow-green">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              {/* Pulsing corner dot */}
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full border border-background animate-pulse" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight block leading-none">NetGuard</span>
              <span className="text-[10px] text-primary font-mono tracking-[0.2em] font-semibold">AI SYSTEM</span>
            </div>
          </div>

          {/* ── Section label ── */}
          <div className="px-5 pt-5 pb-2">
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.2em]">{t('common.navigation') || 'Navigation'}</p>
          </div>

          {/* ── Nav links ── */}
          <nav className="overflow-y-auto px-3 space-y-0.5 mb-2">
            {navItems.filter(item => !item.roles || item.roles.includes(user?.role || 'user')).map(item => {
              const isActive = location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={cn(
                    "sidebar-nav-link",
                    isActive && "sidebar-nav-link-active"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"
                  )} />
                  <span className="flex-1 truncate">{t(item.label)}</span>

                  {item.tag && (
                    <span className={cn(
                      "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wider",
                      item.tag === "LIVE"
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : item.tag === "AI"
                        ? "bg-accent/15 text-accent border border-accent/20"
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {item.tag}
                    </span>
                  )}

                  {isActive && (
                    <ChevronRight className="h-3 w-3 text-primary/60 shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Divider ── */}
          <div className="mx-3 my-2 border-t border-border/40" />
          <div className="px-5 pb-1">
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.2em]">{t('common.system') || 'System'}</p>
          </div>

          {/* ── Settings & Logout ── */}
          <div className="px-3 pb-4 space-y-0.5">
            <Link
              to="/settings"
              onClick={closeSidebar}
              className={cn(
                "sidebar-nav-link",
                location.pathname === "/settings" && "sidebar-nav-link-active"
              )}
            >
              <Settings className={cn(
                "h-4 w-4 shrink-0",
                location.pathname === "/settings" ? "text-primary" : "text-muted-foreground/60"
              )} />
              <span className="flex-1">{t('common.settings')}</span>
              {location.pathname === "/settings" && <ChevronRight className="h-3 w-3 text-primary/60" />}
            </Link>

            <button
              onClick={logout}
              className="sidebar-nav-link w-full text-left hover:!text-destructive hover:!bg-destructive/8 hover:!border-destructive/20"
            >
              <LogOut className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              <span className="flex-1">{t('common.logout')}</span>
            </button>
          </div>

          <div className="flex-1" />

        </aside>

        {/* ════════════════════════════
            MAIN CONTENT
        ════════════════════════════ */}
        <main className="flex-1 flex flex-col min-w-0 h-[calc(100vh-2rem)] md:h-screen overflow-hidden overflow-y-auto relative">

          {/* ── Atmospheric background layers ── */}
          {/* Corner glow — top right */}
          <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[400px] opacity-40"
            style={{ background: "radial-gradient(ellipse at top right, rgba(56,189,248,0.07) 0%, transparent 70%)" }}
          />
          {/* Corner glow — bottom left */}
          <div className="pointer-events-none fixed bottom-0 left-[220px] w-[400px] h-[300px] opacity-30"
            style={{ background: "radial-gradient(ellipse at bottom left, rgba(34,197,94,0.06) 0%, transparent 70%)" }}
          />

          {/* ── Page header bar ── */}
          <div className="sticky top-0 z-20 px-6 py-3 border-b border-border/50 bg-background/70 backdrop-blur-md hidden md:flex items-center gap-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-primary/60">netguard</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground/80">
                {t(navItems.find(n => n.path === location.pathname ||
                  (n.path !== "/" && location.pathname.startsWith(n.path)))?.label || "common.page")}
              </span>
            </div>
            <div className="flex-1" />
            {/* Right side indicators */}
            <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground/60">
              <div className="flex items-center gap-1.5">
                <Wifi className="h-3 w-3 text-primary/60" />
                <span>{t('dashboard.network_active') || 'Tarmoq faol'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <LiveClock />
              </div>
              <div className="flex items-center gap-1.5">
                <StatusDot color="bg-primary" />
                <span className="text-primary/70">{t('dashboard.db_connected') || 'DB ULANGAN'}</span>
              </div>
            </div>
          </div>

          {/* ── Page content ── */}
          <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-none w-full mx-auto relative">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
