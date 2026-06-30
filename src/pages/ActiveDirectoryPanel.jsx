import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Folder, Shield, Trash2, Key, Lock, Unlock, Terminal,
  Network, Globe, UserPlus, Users, Database, Server,
  ArrowLeft, ChevronDown, ChevronRight, Monitor,
  Edit2, MoveRight, RefreshCw, Plus, Search,
  CheckCircle, XCircle, AlertTriangle, Cpu
} from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// ── Context Menu Component ────────────────────────────────────────────────────
function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('contextmenu', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('contextmenu', handler);
    };
  }, [onClose]);

  // Adjust position to stay inside viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menuW = 220;
  const menuH = items.length * 34 + 16;
  const adjX = x + menuW > vw ? x - menuW : x;
  const adjY = y + menuH > vh ? y - menuH : y;

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.12 }}
      style={{ position: 'fixed', left: adjX, top: adjY, zIndex: 9999 }}
      className="bg-[#0d1526]/98 border border-border/60 rounded-xl shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-xl min-w-[200px]"
    >
      {items.map((item, i) =>
        item === 'divider' ? (
          <div key={i} className="h-px bg-border/40 mx-2 my-1" />
        ) : (
          <button
            key={i}
            onClick={() => { item.action(); onClose(); }}
            disabled={item.disabled}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors font-mono',
              item.danger
                ? 'text-destructive hover:bg-destructive/10'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
              item.disabled && 'opacity-30 cursor-not-allowed pointer-events-none'
            )}
          >
            {item.icon && <item.icon className="h-3.5 w-3.5 shrink-0" />}
            {item.label}
          </button>
        )
      )}
    </motion.div>
  );
}

// ── Inline Modal ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0d1526] border border-border/60 rounded-2xl shadow-2xl w-[420px] max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <h3 className="text-sm font-bold font-mono">{title}</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── OU Card Component ─────────────────────────────────────────────────────────
function OUCard({ ou, isAdmin, onContextMenu, onExpand, isExpanded, adStatus }) {
  const onlineRatio = ou.computerCount > 0 ? Math.round((ou.computerCount * 0.7)) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-card border rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer',
        isExpanded ? 'border-primary/40 shadow-lg shadow-primary/10' : 'border-border/40 hover:border-border/80'
      )}
      onContextMenu={isAdmin ? (e) => onContextMenu(e, 'ou', ou) : undefined}
      onClick={() => onExpand(ou.name)}
    >
      {/* Card Top Bar */}
      <div className={cn(
        'h-0.5 w-full bg-gradient-to-r',
        isExpanded ? 'from-primary/60 via-primary/80 to-primary/60' : 'from-transparent via-border/60 to-transparent'
      )} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{ou.icon || '📁'}</span>
            <div>
              <h3 className="text-sm font-bold leading-tight">{ou.displayName}</h3>
              <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                OU={ou.name},OU=Офис Управления
              </p>
            </div>
          </div>
          <ChevronDown className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0',
            isExpanded && 'rotate-180 text-primary'
          )} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/10 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
            <Users className="h-3 w-3 text-blue-400" />
            <div>
              <p className="text-[10px] font-bold text-foreground">{ou.userCount}</p>
              <p className="text-[8px] text-muted-foreground">Xodimlar</p>
            </div>
          </div>
          <div className="bg-muted/10 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
            <Monitor className="h-3 w-3 text-emerald-400" />
            <div>
              <p className="text-[10px] font-bold text-foreground">{ou.computerCount}</p>
              <p className="text-[8px] text-muted-foreground">Kompyuterlar</p>
            </div>
          </div>
        </div>

        {/* AD status dot */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <span className={cn(
            'h-1.5 w-1.5 rounded-full',
            adStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
          )} />
          <span className="text-[9px] text-muted-foreground font-mono">
            {adStatus === 'connected' ? 'AD-TMK live' : 'Local DB mode'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Expanded OU Panel ─────────────────────────────────────────────────────────
function OUExpandedPanel({ ou, isAdmin, onContextMenu, queryClient }) {
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['ou-users', ou.name],
    queryFn: () => apiClient.getOUUsers(ou.name),
    staleTime: 15000,
  });

  const { data: computers = [], isLoading: pcsLoading } = useQuery({
    queryKey: ['ou-computers', ou.name],
    queryFn: () => apiClient.getOUComputers(ou.name),
    staleTime: 15000,
  });

  const users = usersData?.users || [];
  const source = usersData?.source || 'db';

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.adLogin?.toLowerCase().includes(search.toLowerCase()) ||
    u.position?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="col-span-full mt-1 bg-card/50 border border-primary/20 rounded-xl overflow-hidden"
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-primary/5">
        <div className="flex items-center gap-2">
          <span className="text-lg">{ou.icon}</span>
          <div>
            <h4 className="text-sm font-bold">{ou.displayName}</h4>
            <p className="text-[9px] text-muted-foreground font-mono">
              {source === 'ldap' ? '🔗 AD-TMK (LDAP Live)' : '💾 Local DB'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex bg-muted/20 rounded-lg p-0.5">
            {['users', 'computers'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-3 py-1 rounded-md text-[10px] font-bold font-mono transition-all',
                  tab === t ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t === 'users' ? `👥 ${users.length}` : `🖥️ ${computers.length}`}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="h-7 pl-6 text-xs w-40 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div className="p-3">
          {usersLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground font-mono animate-pulse">
              AD-TMK dan yuklanmoqda...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground font-mono">
              Foydalanuvchilar topilmadi
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
              {filtered.map(user => (
                <div
                  key={user.id || user.adLogin}
                  onContextMenu={isAdmin ? (e) => onContextMenu(e, 'user', user, ou) : undefined}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all select-none',
                    'border-border/30 hover:border-border/60 hover:bg-white/3 cursor-context-menu group/user'
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 relative',
                    user.isLocked ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'
                  )}>
                    {(user.fullName || '?').slice(0, 1)}
                    {user.isLocked && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-destructive rounded-full flex items-center justify-center">
                        <Lock className="h-1.5 w-1.5 text-white" />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold truncate">{user.fullName}</p>
                    <p className="text-[9px] text-muted-foreground font-mono truncate">{user.adLogin}</p>
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    {user.isLocked ? (
                      <Badge variant="outline" className="text-[7px] font-mono bg-destructive/10 text-destructive border-destructive/20 px-1 py-0">
                        LOCKED
                      </Badge>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Computers tab */}
      {tab === 'computers' && (
        <div className="p-3">
          {pcsLoading ? (
            <div className="text-center py-8 text-xs text-muted-foreground font-mono animate-pulse">Yuklanmoqda...</div>
          ) : computers.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground font-mono">Kompyuterlar yo'q</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1.5">
              {computers.filter(pc =>
                !search || pc.name.toLowerCase().includes(search.toLowerCase())
              ).map(pc => (
                <div
                  key={pc.id}
                  onContextMenu={isAdmin ? (e) => onContextMenu(e, 'computer', pc, ou) : undefined}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 hover:border-border/60 cursor-context-menu hover:bg-white/3 transition-all"
                >
                  <Cpu className={cn('h-4 w-4 shrink-0', pc.status === 'online' ? 'text-emerald-500' : 'text-muted-foreground')} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold font-mono truncate">{pc.name}</p>
                    <p className="text-[8px] text-muted-foreground truncate">{pc.os}</p>
                  </div>
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    pc.status === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground'
                  )} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function ActiveDirectoryPanel() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === 'developer';

  // State
  const [expandedOU, setExpandedOU]     = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [contextMenu, setContextMenu]   = useState(null); // { x, y, type, target, ou }
  const [modal, setModal]               = useState(null); // { type, data }

  // Fetch OUs
  const { data: ouData, isLoading, refetch } = useQuery({
    queryKey: ['ad-ous'],
    queryFn: apiClient.getADOUs,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const ous = ouData?.ous || [];
  const adStatus = ouData?.adStatus || 'offline';

  // Filter OUs by global search
  const filteredOUs = globalSearch
    ? ous.filter(ou => ou.displayName.toLowerCase().includes(globalSearch.toLowerCase()))
    : ous;

  // Mutations
  const seedMutation = useMutation({
    mutationFn: apiClient.seedAD,
    onSuccess: (data) => {
      toast.success(`Seed yakunlandi: ${data.created} yangi, ${data.skipped} mavjud`);
      queryClient.invalidateQueries(['ad-ous']);
    },
    onError: (err) => toast.error(err.message),
  });

  const resetPassMutation = useMutation({
    mutationFn: ({ id, newPassword }) => apiClient.resetADPassword(id, newPassword),
    onSuccess: (data) => {
      toast.success(data.ldap === 'password_reset_in_ad'
        ? '✅ Parol AD-TMK da tiklandi'
        : '⚠️ Parol faqat lokal bazada tiklandi (AD offline)');
      setModal(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const lockMutation = useMutation({
    mutationFn: (id) => apiClient.toggleADLock(id),
    onSuccess: (data) => {
      toast.success(data.isLocked ? '🔒 Hisob bloklandi' : '🔓 Hisob ochildi');
      queryClient.invalidateQueries(['ou-users', data.ou?.name]);
      setContextMenu(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => apiClient.deleteADUser(id),
    onSuccess: (data, id) => {
      toast.success(data.message);
      queryClient.invalidateQueries(['ad-ous']);
      queryClient.invalidateQueries(['ou-users']);
      setContextMenu(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const createUserMutation = useMutation({
    mutationFn: (data) => apiClient.createADUser(data),
    onSuccess: (data) => {
      toast.success(data.ldap === 'created_in_ad'
        ? `✅ ${data.fullName} AD-TMK ga qo'shildi`
        : `⚠️ ${data.fullName} lokal bazaga qo'shildi (AD offline)`);
      queryClient.invalidateQueries(['ad-ous']);
      queryClient.invalidateQueries(['ou-users', modal?.data?.ouName]);
      setModal(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.updateADUser(id, data),
    onSuccess: () => {
      toast.success('Foydalanuvchi ma\'lumotlari yangilandi');
      queryClient.invalidateQueries(['ou-users']);
      setModal(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const createOUMutation = useMutation({
    mutationFn: (data) => apiClient.createADOU(data),
    onSuccess: (data) => {
      toast.success(`"${data.displayName}" bo'limi yaratildi`);
      queryClient.invalidateQueries(['ad-ous']);
      setModal(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteOUMutation = useMutation({
    mutationFn: (name) => apiClient.deleteADOU(name),
    onSuccess: () => {
      toast.success('Bo\'lim o\'chirildi');
      queryClient.invalidateQueries(['ad-ous']);
      setContextMenu(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const moveUserMutation = useMutation({
    mutationFn: ({ id, targetOUName }) => apiClient.moveADUser(id, targetOUName),
    onSuccess: () => {
      toast.success('Foydalanuvchi ko\'chirildi');
      queryClient.invalidateQueries(['ou-users']);
      queryClient.invalidateQueries(['ad-ous']);
      setModal(null);
    },
    onError: (err) => toast.error(err.message),
  });

  // Context menu handler
  const handleContextMenu = useCallback((e, type, target, ou) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, target, ou });
  }, []);

  // Build context menu items
  const getContextItems = () => {
    if (!contextMenu) return [];
    const { type, target, ou } = contextMenu;

    if (type === 'user') {
      return [
        { label: target.fullName, icon: Users, disabled: true },
        'divider',
        { label: 'Parolni tiklash', icon: Key, action: () => { setContextMenu(null); setModal({ type: 'reset-pass', data: target }); } },
        { label: target.isLocked ? 'Hisobni ochish' : 'Hisobni bloklash', icon: target.isLocked ? Unlock : Lock, action: () => lockMutation.mutate(target.id) },
        { label: 'Tahrirlash', icon: Edit2, action: () => { setContextMenu(null); setModal({ type: 'edit-user', data: target }); } },
        { label: 'Ko\'chirish', icon: MoveRight, action: () => { setContextMenu(null); setModal({ type: 'move-user', data: target }); } },
        'divider',
        { label: 'O\'chirish', icon: Trash2, danger: true, action: () => { if (confirm(`"${target.fullName}" ni o'chirasizmi?`)) deleteUserMutation.mutate(target.id); } },
      ];
    }

    if (type === 'ou') {
      return [
        { label: target.displayName, icon: Folder, disabled: true },
        'divider',
        { label: 'Yangi foydalanuvchi', icon: UserPlus, action: () => { setContextMenu(null); setModal({ type: 'add-user', data: { ouName: target.name } }); } },
        { label: 'Bo\'lim tahrirlash', icon: Edit2, action: () => { setContextMenu(null); setModal({ type: 'edit-ou', data: target }); } },
        'divider',
        { label: 'Bo\'limni o\'chirish', icon: Trash2, danger: true, action: () => { if (confirm(`"${target.displayName}" bo'limini o'chirasizmi?`)) deleteOUMutation.mutate(target.name); } },
      ];
    }

    if (type === 'computer') {
      return [
        { label: target.name, icon: Monitor, disabled: true },
        'divider',
        { label: 'Xususiyatlar', icon: Cpu, action: () => toast.info(`${target.name} — ${target.os}`) },
        { label: 'Domendan chiqarish', icon: Trash2, danger: true, action: () => { if (confirm(`"${target.name}" ni domendan chiqarasizmi?`)) apiClient.deleteADComputer(target.id).then(() => { toast.success('Kompyuter o\'chirildi'); queryClient.invalidateQueries(['ou-computers', ou?.name]); }); } },
      ];
    }

    return [];
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden" onClick={() => setContextMenu(null)}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="shrink-0 h-12 px-4 flex items-center justify-between border-b border-border/40 bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Button>
          <span className="text-border/60">|</span>
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold tracking-tight">Active Directory</span>
            <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-primary/30 text-primary ml-1">ADAC</Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className={cn('h-1.5 w-1.5 rounded-full', adStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500')} />
            <span className="text-muted-foreground">
              {adStatus === 'connected' ? 'AD-TMK • uztmk.local' : 'Local DB • AD offline'}
            </span>
          </div>
          <span className="text-border/40">·</span>
          <span className="text-[10px] font-mono text-muted-foreground">{currentUser?.name}</span>

          {isAdmin && (
            <Button variant="outline" size="sm"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="h-7 text-[10px] font-mono gap-1.5">
              <Database className="h-3 w-3" />
              {seedMutation.isPending ? 'Seeding...' : 'Seed DB'}
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 w-7 p-0">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* ── KPI Bar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-5 gap-2 px-4 py-2 border-b border-border/30 bg-card/10">
        {[
          { label: 'Domain', val: 'uztmk.local', icon: Globe, color: 'text-blue-400' },
          { label: 'DC / GC', val: 'AD-TMK', icon: Server, color: 'text-indigo-400' },
          { label: 'Jami OU', val: `${ous.length} ta`, icon: Folder, color: 'text-amber-400' },
          { label: 'Jami Xodim', val: `${ous.reduce((s, o) => s + o.userCount, 0)} ta`, icon: Users, color: 'text-emerald-400' },
          { label: 'AD Holat', val: adStatus === 'connected' ? 'ONLINE' : 'OFFLINE', icon: adStatus === 'connected' ? CheckCircle : AlertTriangle, color: adStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400' },
        ].map((k, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-card/40 rounded-lg border border-border/30">
            <k.icon className={cn('h-3.5 w-3.5 shrink-0', k.color)} />
            <div className="min-w-0">
              <p className="text-[8px] text-muted-foreground uppercase font-mono tracking-wider">{k.label}</p>
              <p className="text-xs font-bold font-mono truncate">{k.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Workspace ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4">

        {/* Top toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary font-bold">uztmk.local</span>
            <ChevronRight className="h-3 w-3" />
            <span>Офис Управления</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Bo'lim qidirish..."
                className="h-8 pl-8 text-xs w-52 font-mono"
              />
            </div>
            {isAdmin && (
              <Button size="sm" onClick={() => setModal({ type: 'add-ou', data: {} })}
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-bold">
                <Plus className="h-3.5 w-3.5" />
                Yangi OU
              </Button>
            )}
          </div>
        </div>

        {/* OU Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-36 bg-card border border-border/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3"
            >
              {filteredOUs.map(ou => (
                <OUCard
                  key={ou.id}
                  ou={ou}
                  isAdmin={isAdmin}
                  onContextMenu={handleContextMenu}
                  onExpand={(name) => setExpandedOU(prev => prev === name ? null : name)}
                  isExpanded={expandedOU === ou.name}
                  adStatus={adStatus}
                />
              ))}
            </motion.div>

            {/* Expanded OU panel (full width, below grid) */}
            <AnimatePresence mode="wait">
              {expandedOU && filteredOUs.find(o => o.name === expandedOU) && (
                <OUExpandedPanel
                  key={expandedOU}
                  ou={filteredOUs.find(o => o.name === expandedOU)}
                  isAdmin={isAdmin}
                  onContextMenu={handleContextMenu}
                  queryClient={queryClient}
                />
              )}
            </AnimatePresence>

            {filteredOUs.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-mono">Bo'limlar topilmadi</p>
                <p className="text-xs mt-1 opacity-60">Seed DB tugmasini bosing</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Context Menu ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={getContextItems()}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {/* Reset Password */}
        {modal?.type === 'reset-pass' && (
          <PasswordResetModal
            user={modal.data}
            onClose={() => setModal(null)}
            onSubmit={(pwd) => resetPassMutation.mutate({ id: modal.data.id, newPassword: pwd })}
            loading={resetPassMutation.isPending}
          />
        )}

        {/* Add User */}
        {modal?.type === 'add-user' && (
          <AddUserModal
            ouName={modal.data.ouName}
            ous={ous}
            onClose={() => setModal(null)}
            onSubmit={(data) => createUserMutation.mutate(data)}
            loading={createUserMutation.isPending}
          />
        )}

        {/* Edit User */}
        {modal?.type === 'edit-user' && (
          <EditUserModal
            user={modal.data}
            onClose={() => setModal(null)}
            onSubmit={(data) => updateUserMutation.mutate({ id: modal.data.id, data })}
            loading={updateUserMutation.isPending}
          />
        )}

        {/* Move User */}
        {modal?.type === 'move-user' && (
          <MoveUserModal
            user={modal.data}
            ous={ous}
            onClose={() => setModal(null)}
            onSubmit={(targetOUName) => moveUserMutation.mutate({ id: modal.data.id, targetOUName })}
            loading={moveUserMutation.isPending}
          />
        )}

        {/* Add OU */}
        {modal?.type === 'add-ou' && (
          <AddOUModal
            onClose={() => setModal(null)}
            onSubmit={(data) => createOUMutation.mutate(data)}
            loading={createOUMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//   MODAL COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function PasswordResetModal({ user, onClose, onSubmit, loading }) {
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  return (
    <Modal title={`🔑 Parol tiklash — ${user.fullName}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-amber-400 font-mono">
            ⚠️ Parol AD-TMK ga LDAPS (port 636) orqali yuboriladi.
            Server offline bo'lsa — faqat lokal bazada yangilanadi.
          </p>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Yangi parol</label>
          <Input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Min. 8 belgi..." className="text-xs font-mono" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Tasdiqlash</label>
          <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Qayta kiriting..." className="text-xs font-mono" />
        </div>
        {pwd && confirm && pwd !== confirm && (
          <p className="text-xs text-destructive font-mono">Parollar mos kelmadi</p>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 text-xs">Bekor</Button>
          <Button
            onClick={() => onSubmit(pwd)}
            disabled={!pwd || pwd !== confirm || loading}
            className="flex-1 text-xs bg-primary font-bold"
          >
            {loading ? 'Yuklanmoqda...' : 'Tiklash'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AddUserModal({ ouName, ous, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ adLogin: '', fullName: '', position: '', email: '', phone: '', ouName, password: 'Netguard@2026' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <Modal title="👤 Yangi foydalanuvchi qo'shish" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground font-mono mb-1 block">To'liq ism *</label>
            <Input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Sobir Rahimov" className="text-xs" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-mono mb-1 block">AD Login *</label>
            <Input value={form.adLogin} onChange={e => set('adLogin', e.target.value)} placeholder="sobir.rahimov" className="text-xs font-mono" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Lavozim</label>
          <Input value={form.position} onChange={e => set('position', e.target.value)} placeholder="Geolog" className="text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Email</label>
            <Input value={form.email} onChange={e => set('email', e.target.value)} placeholder="auto@uztmk.local" className="text-xs font-mono" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Bo'lim</label>
            <select
              value={form.ouName}
              onChange={e => set('ouName', e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {ous.map(o => <option key={o.name} value={o.name}>{o.displayName}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Boshlang'ich parol</label>
          <Input value={form.password} onChange={e => set('password', e.target.value)} className="text-xs font-mono" />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 text-xs">Bekor</Button>
          <Button
            onClick={() => onSubmit(form)}
            disabled={!form.adLogin || !form.fullName || loading}
            className="flex-1 text-xs bg-primary font-bold"
          >
            {loading ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ fullName: user.fullName, position: user.position || '', email: user.email || '', phone: user.phone || '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <Modal title={`✏️ Tahrirlash — ${user.adLogin}`} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-muted-foreground font-mono mb-1 block">To'liq ism</label>
          <Input value={form.fullName} onChange={e => set('fullName', e.target.value)} className="text-xs" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Lavozim</label>
          <Input value={form.position} onChange={e => set('position', e.target.value)} className="text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Email</label>
            <Input value={form.email} onChange={e => set('email', e.target.value)} className="text-xs font-mono" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Telefon</label>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} className="text-xs font-mono" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 text-xs">Bekor</Button>
          <Button onClick={() => onSubmit(form)} disabled={loading} className="flex-1 text-xs bg-primary font-bold">
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function MoveUserModal({ user, ous, onClose, onSubmit, loading }) {
  const [target, setTarget] = useState('');
  return (
    <Modal title={`📂 Ko'chirish — ${user.fullName}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-mono">
          Foydalanuvchini qaysi bo'limga ko'chirasiz?
        </p>
        <select
          value={target}
          onChange={e => setTarget(e.target.value)}
          className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Bo'limni tanlang...</option>
          {ous.map(o => <option key={o.name} value={o.name}>{o.displayName}</option>)}
        </select>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 text-xs">Bekor</Button>
          <Button onClick={() => onSubmit(target)} disabled={!target || loading} className="flex-1 text-xs bg-primary font-bold">
            {loading ? 'Ko\'chirilmoqda...' : 'Ko\'chirish'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AddOUModal({ onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ name: '', displayName: '', icon: '📁', description: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const ICONS = ['📁','🏭','🔬','💰','👥','🛡️','📦','📊','⚗️','💧','📤','⚖️','🔄','⛑️','📈','🏗️','🌱','🔮','🖥️'];
  return (
    <Modal title="📁 Yangi OU (Bo'lim) yaratish" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground font-mono mb-1 block">OU nomi (Latin) *</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Yangi_Bolim" className="text-xs font-mono" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Ko'rsatiladigan nom</label>
            <Input value={form.displayName} onChange={e => set('displayName', e.target.value)} placeholder="Yangi Bo'lim" className="text-xs" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Icon tanlang</label>
          <div className="flex flex-wrap gap-1.5">
            {ICONS.map(ic => (
              <button key={ic} onClick={() => set('icon', ic)}
                className={cn('text-lg w-8 h-8 rounded-lg border transition-all', form.icon === ic ? 'border-primary bg-primary/10' : 'border-border/40 hover:border-border/80')}>
                {ic}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Tavsif</label>
          <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Bo'lim haqida..." className="text-xs" />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 text-xs">Bekor</Button>
          <Button onClick={() => onSubmit({ ...form, displayName: form.displayName || form.name })} disabled={!form.name || loading} className="flex-1 text-xs bg-primary font-bold">
            {loading ? 'Yaratilmoqda...' : 'Yaratish'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
