import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Printer, ScrollText, Search, 
  Trash2, RefreshCcw, Wifi,
  FileText, Settings, Activity
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


import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/**
 * Enterprise Printer Monitoring Dashboard
 */
export default function PrinterPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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

  // Filtering
  const filteredQueue = useMemo(() => {
    return queue.filter(job => {
      const matchesSearch = job.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.userName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || job.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [queue, searchTerm, filterStatus]);

  // Full-page spinnerni olib tashladik. 
  // Komponent doim render qilinadi, ma'lumot kelguncha shunchaki bo'sh array bo'ladi.

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
            <PrinterCard key={printer.id} printer={printer} />
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
    </div>
  );
}

function PrinterCard({ printer }) {
  const isPrinting = printer.printJobs?.some(j => j.status === 'PRINTING');
  const isLowToner = printer.tonerLevel < 15;
  const isDown = printer.status !== 'online';

  return (
    <motion.div 
      layout
      initial={false} // Prevent re-animation on updates
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-card border rounded-xl overflow-hidden card-hover relative group transition-all duration-300",
        isDown ? "opacity-70 grayscale" : ""
      )}
    >
      {/* Top Banner */}
      <div className={cn(
        "h-1.5 w-full",
        isDown ? "bg-destructive/50" : isPrinting ? "bg-primary animate-pulse" : "bg-primary/20"
      )} />

      <div className="p-5 space-y-6">
        {/* Identity Row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
             <div className={cn(
               "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
               isDown ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary border border-primary/20 glow-green"
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
            isDown ? "status-offline" : isPrinting ? "bg-primary/20 text-primary border-primary/30" : "status-online"
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", isDown ? "bg-muted-foreground" : "bg-primary animate-pulse")} />
            {isDown ? "OFFLINE" : isPrinting ? "PRINTING" : "READY"}
          </div>
        </div>

        {/* Toner Level Row */}
        <div className="space-y-2">
           <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider">
              <div className="flex items-center gap-1 text-muted-foreground">
                 <Activity className="h-3 w-3" />
                 Toner
              </div>
              <span className={cn(isLowToner ? "text-destructive font-bold animate-pulse" : "text-foreground")}>
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
      </div>

      {/* Settings overlay element on hover if online */}
      {!isDown && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md bg-background/50 backdrop-blur-sm border border-border/40">
             <Settings className="h-3.5 w-3.5" />
           </Button>
        </div>
      )}
    </motion.div>
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
