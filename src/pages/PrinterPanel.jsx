import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Printer, ScrollText, Search, 
  Trash2, RefreshCcw, Wifi,
  FileText, Settings, Activity,
  Plus, Power, Wrench, BatteryCharging,
  ArrowLeft, Check, Lock, Unlock, Users, UserPlus
} from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/AuthContext";

import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/**
 * Enterprise Printer Monitoring Dashboard
 */
export default function PrinterPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPrinterId, setSelectedPrinterId] = useState(null);

  // Fetch Printers & Queue
  const { data: printers = [], isInitialLoading: printersLoading } = useQuery({
    queryKey: ['printers'],
    queryFn: apiClient.getPrinters,
    refetchInterval: 8000, // Slightly slower polling
    staleTime: 5000
  });

  const { data: queue = [], isInitialLoading: queueLoading } = useQuery({
    queryKey: ['printQueue'],
    queryFn: apiClient.getPrintQueue,
    refetchInterval: 5000,
    staleTime: 3000
  });

  // Mutations
  const cancelMutation = useMutation({
    mutationFn: apiClient.cancelPrintJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['printQueue']);
      toast.success("Chop etish bekor qilindi");
    },
    onError: (err) => toast.error(err.message)
  });

  const retryMutation = useMutation({
    mutationFn: apiClient.retryPrintJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['printQueue']);
      toast.success("Qayta yuborildi");
    },
    onError: (err) => toast.error(err.message)
  });

  const createJobMutation = useMutation({
    mutationFn: apiClient.createPrintJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['printQueue']);
      queryClient.invalidateQueries(['printers']);
      toast.success("Chop etish vazifasi muvaffaqiyatli qo'shildi");
      setIsCreateOpen(false);
    },
    onError: (err) => toast.error(err.message)
  });

  const refillTonerMutation = useMutation({
    mutationFn: apiClient.refillPrinterToner,
    onSuccess: () => {
      queryClient.invalidateQueries(['printers']);
      toast.success("Printer toneri to'ldirildi (100%)");
    },
    onError: (err) => toast.error(err.message)
  });

  const toggleStatusMutation = useMutation({
    mutationFn: apiClient.togglePrinterStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['printers']);
      toast.success(`Printer statusi o'zgartirildi: ${data.status.toUpperCase()}`);
    },
    onError: (err) => toast.error(err.message)
  });

  const fixPrinterMutation = useMutation({
    mutationFn: apiClient.fixPrinter,
    onSuccess: () => {
      queryClient.invalidateQueries(['printers']);
      toast.success("Printerning texnik muammolari bartaraf etildi!");
    },
    onError: (err) => toast.error(err.message)
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, authorizedUsers }) => apiClient.updatePrinterPermissions(id, authorizedUsers),
    onSuccess: () => {
      queryClient.invalidateQueries(['printers']);
      toast.success("Ruxsatnomalar muvaffaqiyatli yangilandi");
    },
    onError: (err) => toast.error(err.message)
  });

  // Filtering
  const filteredQueue = useMemo(() => {
    return queue.filter(job => {
      const matchesSearch = job.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.userName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || job.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [queue, searchTerm, filterStatus]);

  const selectedPrinter = useMemo(() => {
    return printers.find(p => p.id === selectedPrinterId);
  }, [printers, selectedPrinterId]);

  const isRestricted = selectedPrinter?.authorizedUsers && selectedPrinter?.authorizedUsers !== 'all';
  
  const authorizedList = useMemo(() => {
    if (!selectedPrinter || !isRestricted) return [];
    return selectedPrinter.authorizedUsers.split(',').map(e => e.trim()).filter(Boolean);
  }, [selectedPrinter, isRestricted]);

  const handleAddUser = (email) => {
    if (!email.trim() || !email.includes('@')) {
      toast.error("Yaroqli email kiriting");
      return;
    }
    const emailLower = email.trim().toLowerCase();
    if (authorizedList.map(e => e.toLowerCase()).includes(emailLower)) {
      toast.error("Bu email allaqachon qo'shilgan");
      return;
    }
    const newList = [...authorizedList, emailLower].join(',');
    updatePermissionsMutation.mutate({ id: selectedPrinter.id, authorizedUsers: newList });
  };
  
  const handleRemoveUser = (email) => {
    const newList = authorizedList
      .filter(e => e.toLowerCase() !== email.toLowerCase())
      .join(',');
    updatePermissionsMutation.mutate({ id: selectedPrinter.id, authorizedUsers: newList || 'all' });
  };

  const handleToggleRestriction = (restricted) => {
    const newValue = restricted ? (user?.email || 'admin@netguard.ai') : 'all';
    updatePermissionsMutation.mutate({ id: selectedPrinter.id, authorizedUsers: newValue });
  };

  if (selectedPrinterId && selectedPrinter) {
    return (
      <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Back navigation */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedPrinterId(null)}
            className="gap-1.5 h-8 font-semibold text-xs border border-border/50 bg-card/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Orqaga
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Printer Operator</span>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-sm font-bold font-mono text-primary">{selectedPrinter.hostname}</span>
          </div>
        </div>

        {/* Detailed Printer Summary Card */}
        <div className="bg-card border border-border/60 rounded-xl overflow-hidden glass-card shadow-lg p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-16 w-16 rounded-xl flex items-center justify-center transition-colors border",
              selectedPrinter.status !== 'online' ? "bg-muted text-muted-foreground border-border" : 
              selectedPrinter.risk_level === 'warning' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
              "bg-primary/10 text-primary border-primary/20 glow-green"
            )}>
              <Printer className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{selectedPrinter.hostname}</h2>
                <Badge variant="outline" className={cn(
                  "text-[9px] font-mono font-bold tracking-wider border",
                  selectedPrinter.status !== 'online' ? "bg-muted text-muted-foreground border-border" : 
                  selectedPrinter.risk_level === 'warning' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                  "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                )}>
                  {selectedPrinter.status === 'online' ? (selectedPrinter.risk_level === 'warning' ? "WARNING" : "READY") : "OFFLINE"}
                </Badge>
              </div>
              <p className="text-sm font-mono text-muted-foreground uppercase">{selectedPrinter.modelName || 'Enterprise Jet'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full lg:w-auto">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Tarmoq IP</span>
              <div className="text-sm font-mono font-bold">{selectedPrinter.ip_address}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Jami Chop etilgan</span>
              <div className="text-sm font-mono font-bold">{selectedPrinter.pageCount?.toLocaleString()} sahifa</div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Toner Level</span>
              <div className={cn("text-sm font-mono font-bold", selectedPrinter.tonerLevel < 15 ? "text-destructive" : "text-foreground")}>
                {selectedPrinter.tonerLevel}%
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Navbatdagi vazifalar</span>
              <div className="text-sm font-mono font-bold">{queue.filter(j => j.printerId === selectedPrinter.id && (j.status === 'PENDING' || j.status === 'PRINTING')).length} ta</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => toggleStatusMutation.mutate(selectedPrinter.id)}
              className="gap-1 text-xs"
            >
              <Power className="h-3.5 w-3.5" />
              {selectedPrinter.status === 'online' ? "O'chirish" : "Yoqish"}
            </Button>
            {selectedPrinter.status === 'online' && selectedPrinter.tonerLevel < 100 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refillTonerMutation.mutate(selectedPrinter.id)}
                className="gap-1 text-xs text-primary border-primary/20 hover:bg-primary/10"
              >
                <BatteryCharging className="h-3.5 w-3.5" />
                Toner Refill
              </Button>
            )}
            {selectedPrinter.status === 'online' && selectedPrinter.risk_level === 'warning' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fixPrinterMutation.mutate(selectedPrinter.id)}
                className="gap-1 text-xs text-amber-500 border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20"
              >
                <Wrench className="h-3.5 w-3.5" />
                Tuzatish
              </Button>
            )}
          </div>
        </div>

        {/* Detailed Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Printer Print Queue - Left Column (Spans 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Chop etish tarixi va navbati</h3>
              </div>
              {selectedPrinter.status === 'online' && (
                <Button 
                  size="sm" 
                  onClick={() => setIsCreateOpen(true)}
                  className="h-8 gap-1 text-xs font-semibold px-3 bg-primary text-primary-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Yangi chop etish
                </Button>
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-card overflow-hidden glass-card shadow-lg">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Fayl nomi</TableHead>
                    <TableHead>Foydalanuvchi</TableHead>
                    <TableHead>Yuborildi</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.filter(j => j.printerId === selectedPrinter.id).map(job => (
                    <TableRow key={job.id} className="table-row-hover group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-primary" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{job.fileName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">JOB #{job.id}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border">
                            <AvatarFallback className="text-[10px]">{job.userName.substring(0,2)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{job.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(job.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" size="icon" className="h-7 w-7" 
                            onClick={() => retryMutation.mutate(job.id)}
                            disabled={job.status === 'PRINTING' || job.status === 'COMPLETED'}
                          >
                            <RefreshCcw className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => cancelMutation.mutate(job.id)}
                            disabled={job.status === 'COMPLETED' || job.status === 'FAILED'}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {queue.filter(j => j.printerId === selectedPrinter.id).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic text-xs font-mono">
                        Hozircha hech qanday chop etish tarixi yo'q.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Access Control - Right Column (Spans 1 col) */}
          <div className="space-y-4">
            <div className="border-b border-border/60 pb-2 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Foydalanuvchilar ruxsati</h3>
            </div>

            <div className="bg-card border border-border/60 rounded-xl p-5 glass-card space-y-6">
              {/* Access Control Type */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Ruxsat Turi</span>
                <div className="flex bg-muted/30 rounded-lg p-1 border border-border/40">
                  <button 
                    onClick={() => handleToggleRestriction(false)}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-xs font-medium font-mono uppercase transition-all flex items-center justify-center gap-1",
                      !isRestricted ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Unlock className="h-3 w-3" /> Hamma
                  </button>
                  <button 
                    onClick={() => handleToggleRestriction(true)}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-xs font-medium font-mono uppercase transition-all flex items-center justify-center gap-1",
                      isRestricted ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Lock className="h-3 w-3" /> Cheklangan
                  </button>
                </div>
              </div>

              {isRestricted ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Add User Form */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Foydalanuvchi qo'shish</span>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const val = e.target.email.value;
                        handleAddUser(val);
                        e.target.email.value = "";
                      }}
                      className="flex gap-2"
                    >
                      <Input 
                        name="email"
                        type="email"
                        placeholder="email@netguard.ai"
                        className="h-8 text-xs font-mono"
                      />
                      <Button type="submit" size="sm" className="h-8 gap-1 px-3 text-xs bg-primary text-primary-foreground">
                        <UserPlus className="h-3.5 w-3.5" /> Qo'shish
                      </Button>
                    </form>
                  </div>

                  {/* List of Authorized Users */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Ruxsati Bor Foydalanuvchilar ({authorizedList.length})</span>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {authorizedList.map(email => (
                        <div key={email} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-6 w-6 border">
                              <AvatarFallback className="text-[10px]">{email.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-mono truncate">{email}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemoveUser(email)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      {authorizedList.length === 0 && (
                        <div className="text-center py-4 text-xs text-muted-foreground italic font-mono">
                          Hech qanday foydalanuvchiga ruxsat berilmagan.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-center space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Check className="h-5 w-5 mx-auto animate-bounce" />
                  <p className="text-xs font-bold font-mono">ERKIN FOYDALANISH REJIMI</p>
                  <p className="text-[10px] text-muted-foreground">Tizimga kirgan barcha tasdiqlangan foydalanuvchilar ushbu printerda chop eta oladilar.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <CreateJobDialog 
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          printers={printers}
          onSubmit={(data) => createJobMutation.mutate(data)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Printer Operator</h1>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary">ENTERPRISE v2.0</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Ofis printerlari texnik holati va chop etish navbatlarini real-vaqt rejimida boshqarish.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="h-9 gap-1.5 text-xs font-semibold px-4 bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            Yangi chop etish
          </Button>
          <div className="flex flex-col items-end px-3 py-1.5 border border-border bg-card/40 rounded-lg">
             <span className="text-[10px] text-muted-foreground uppercase font-mono">Tizim holati</span>
             <div className="flex items-center gap-1.5 font-mono text-xs text-primary">
                <Activity className="h-3 w-3 animate-pulse" />
                ACTIVE MONITOR
             </div>
          </div>
        </div>
      </div>

      {/* Printer Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {printersLoading && printers.length === 0 ? (
          // Ma'lumot yo'qligida "Skeleton" o'rniga oddiy placeholder
          [1,2,3].map(i => <div key={i} className="h-48 rounded-xl border border-border/40 bg-card/20 animate-pulse" />)
        ) : (
          printers.map((printer) => (
            <div 
              key={printer.id}
              onClick={(e) => {
                if (e.target.closest('button')) return;
                setSelectedPrinterId(printer.id);
              }}
              className="cursor-pointer"
            >
              <PrinterCard 
                printer={printer} 
                onRefill={(id) => refillTonerMutation.mutate(id)}
                onToggle={(id) => toggleStatusMutation.mutate(id)}
                onFix={(id) => fixPrinterMutation.mutate(id)}
              />
            </div>
          ))
        )}
      </div>

      {/* Queue Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Chop etish navbati (Print Queue)</h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative w-64 hidden md:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Navbatdan qidirish..." 
                  className="pl-8 h-8 text-xs font-mono"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex border border-border rounded-md overflow-hidden h-8">
                {['all', 'PENDING', 'PRINTING'].map(s => (
                  <button 
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={cn(
                      "px-3 text-[10px] font-bold uppercase transition-colors border-r border-border last:border-0",
                      filterStatus === s ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
                    )}
                  >
                    {s === 'all' ? 'Barchasi' : s}
                  </button>
                ))}
             </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card overflow-hidden glass-card shadow-lg shadow-black/20">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">Fayl nomi</TableHead>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Yuborildi</TableHead>
                <TableHead>Printer</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode='popLayout'>
                {filteredQueue.map((job) => (
                  <motion.tr 
                    key={job.id}
                    initial={false}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="table-row-hover group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[200px]">{job.fileName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">JOB #{job.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border border-border/60">
                          <AvatarFallback className="text-[10px] font-mono">{job.userName.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{job.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {new Date(job.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {job.printer?.hostname || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" size="icon" className="h-7 w-7" 
                          onClick={() => retryMutation.mutate(job.id)}
                          disabled={job.status === 'PRINTING' || job.status === 'COMPLETED'}
                        >
                          <RefreshCcw className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => cancelMutation.mutate(job.id)}
                          disabled={job.status === 'COMPLETED' || job.status === 'FAILED'}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredQueue.length === 0 && (
                <TableRow>
                   <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic font-mono text-xs">
                      Hozirda hech qanday chop etish navbati yo'q.
                   </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <CreateJobDialog 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        printers={printers}
        onSubmit={(data) => createJobMutation.mutate(data)}
      />
    </div>
  );
}

function PrinterCard({ printer, onRefill, onToggle, onFix }) {
  const isPrinting = printer.printJobs?.some(j => j.status === 'PRINTING');
  const isLowToner = printer.tonerLevel < 15;
  const isDown = printer.status !== 'online';
  const hasWarning = printer.risk_level === 'warning';

  return (
    <motion.div 
      layout
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-card border rounded-xl overflow-hidden card-hover relative group transition-all duration-300 shadow-sm",
        isDown ? "opacity-75" : ""
      )}
    >
      {/* Top Banner */}
      <div className={cn(
        "h-1.5 w-full transition-all duration-300",
        isDown ? "bg-muted-foreground/40" : hasWarning ? "bg-amber-500" : isPrinting ? "bg-primary animate-pulse" : "bg-emerald-500"
      )} />

      <div className="p-5 space-y-5">
        {/* Identity Row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
             <div className={cn(
               "h-10 w-10 rounded-lg flex items-center justify-center transition-colors border",
               isDown ? "bg-muted text-muted-foreground border-border" : 
               hasWarning ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
               "bg-primary/10 text-primary border-primary/20 glow-green"
             )}>
                <Printer className="h-5 w-5" />
             </div>
             <div>
                <h3 className="text-sm font-bold tracking-tight">{printer.hostname}</h3>
                <p className="text-[10px] text-muted-foreground font-mono uppercase truncate max-w-[150px]">{printer.modelName || 'Enterprise Jet'}</p>
             </div>
          </div>
          <div className={cn(
            "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1",
            isDown ? "status-offline" : 
            hasWarning ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
            isPrinting ? "bg-primary/10 text-primary border-primary/20" : 
            "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", isDown ? "bg-muted-foreground" : hasWarning ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
            {isDown ? "OFFLINE" : hasWarning ? "WARNING" : isPrinting ? "PRINTING" : "READY"}
          </div>
        </div>

        {/* Toner Level Row */}
        <div className="space-y-2">
           <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider">
              <div className="flex items-center gap-1 text-muted-foreground">
                 <Activity className="h-3 w-3" />
                 Toner
              </div>
              <span className={cn(isLowToner && !isDown ? "text-destructive font-bold animate-pulse" : "text-foreground")}>
                {printer.tonerLevel}%
              </span>
           </div>
           <Progress 
             value={printer.tonerLevel} 
             className={cn("h-1.5", isLowToner ? "bg-destructive/20" : "")} 
           />
        </div>

        {/* Metrics Footer */}
        <div className="pt-4 border-t border-border/40 grid grid-cols-2 gap-4">
           <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Jami sahifa</span>
              <div className="flex items-center gap-1.5 text-sm font-bold font-mono">
                 <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                 {printer.pageCount?.toLocaleString()}
              </div>
           </div>
           <div className="space-y-1 text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Tarmoq IP</span>
              <div className="flex items-center justify-end gap-1.5 text-[11px] font-mono text-foreground/80">
                 {printer.ip_address}
                 <Wifi className="h-3 w-3 text-muted-foreground/60" />
              </div>
           </div>
        </div>

        {/* Controls Row */}
        <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-2">
          {/* Status Toggle Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onToggle(printer.id)} 
            className="h-7 px-2 text-[10px] uppercase font-mono tracking-wider hover:bg-secondary/60 flex items-center gap-1"
          >
            <Power className={cn("h-3.5 w-3.5", isDown ? "text-muted-foreground" : "text-emerald-500")} />
            {isDown ? "Yoqish" : "O'chirish"}
          </Button>

          <div className="flex items-center gap-1.5">
            {/* Toner Refill Button */}
            {!isDown && printer.tonerLevel < 100 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onRefill(printer.id)} 
                className="h-7 px-2.5 text-[10px] uppercase font-mono tracking-wider text-primary border-primary/20 hover:bg-primary/10 hover:text-primary flex items-center gap-1"
              >
                <BatteryCharging className="h-3.5 w-3.5" />
                Refill
              </Button>
            )}

            {/* Warning fix button */}
            {!isDown && hasWarning && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onFix(printer.id)} 
                className="h-7 px-2.5 text-[10px] uppercase font-mono tracking-wider text-amber-500 border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-400 flex items-center gap-1 animate-pulse"
              >
                <Wrench className="h-3.5 w-3.5" />
                Tuzatish
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CreateJobDialog({ isOpen, onClose, printers, onSubmit, preselectedPrinterId }) {
  const { user } = useAuth();
  const [fileName, setFileName] = useState("");
  const [selectedPrinterId, setSelectedPrinterId] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (preselectedPrinterId) {
        setSelectedPrinterId(preselectedPrinterId.toString());
      } else {
        setSelectedPrinterId("");
      }
    }
  }, [preselectedPrinterId, isOpen]);

  const activePrinters = printers.filter(p => p.status === 'online');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fileName.trim()) {
      toast.error("Fayl nomini kiriting");
      return;
    }
    if (!selectedPrinterId) {
      toast.error("Printerni tanlang");
      return;
    }
    onSubmit({
      fileName,
      userName: user?.name || user?.email || "Operator",
      printerId: parseInt(selectedPrinterId)
    });
    setFileName("");
    setSelectedPrinterId("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md overflow-hidden rounded-xl border border-border/60 bg-card p-6 shadow-2xl glass-card z-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Yangi chop etish vazifasi</h3>
                <p className="text-xs text-muted-foreground">Faylni printer navbatiga yuborish</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Fayl Nomi</label>
                <Input 
                  placeholder="Masalan: shartnoma_v2.pdf" 
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Foydalanuvchi</label>
                <Input 
                  value={user?.name || user?.email || "Operator"} 
                  disabled 
                  className="bg-muted/50 font-mono text-sm opacity-80"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Printerni Tanlang</label>
                <select 
                  value={selectedPrinterId}
                  onChange={(e) => setSelectedPrinterId(e.target.value)}
                  disabled={!!preselectedPrinterId}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-70"
                >
                  <option value="" className="bg-card text-foreground">-- Tanlang --</option>
                  {activePrinters.map(printer => (
                    <option key={printer.id} value={printer.id} className="bg-card text-foreground">
                      {printer.hostname} ({printer.modelName})
                    </option>
                  ))}
                  {activePrinters.length === 0 && (
                    <option disabled className="bg-card text-muted-foreground">Hech qanday faol printer yo'q</option>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Bekor qilish
                </Button>
                <Button type="submit" size="sm" disabled={activePrinters.length === 0} className="bg-primary text-primary-foreground">
                  Yuborish
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PENDING: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    PRINTING: "bg-primary/10 text-primary border-primary/20",
    COMPLETED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    FAILED: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <Badge variant="outline" className={cn("text-[9px] font-mono font-bold tracking-wider", styles[status])}>
      {status}
    </Badge>
  );
}
