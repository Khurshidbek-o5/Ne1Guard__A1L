import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import moment from "moment";
import { apiClient } from "@/api/apiClient";
import { ShieldCheck, Search, ShieldX, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const severityStyles = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  medium: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  low: "bg-accent/10 text-accent border-accent/20",
};

export default function AlertDetailDialog({ alert, open, onOpenChange, onStatusChange }) {
  const [loading, setLoading] = useState(false);

  if (!alert) return null;

  const handleStatusUpdate = async (status) => {
    setLoading(true);
    try {
      await apiClient.updateAlertStatus(alert.id, status);
      toast({ title: "Holat yangilandi", description: `Alert holati '${status}' etib belgilandi.` });
      if (onStatusChange) onStatusChange();
    } catch (err) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
             <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded border", severityStyles[alert.severity])}>
              {alert.severity}
            </span>
            <DialogTitle>{alert.type}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="bg-secondary/30 p-4 rounded-lg border border-border/50">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tavsif</h4>
            <p className="text-sm leading-relaxed">{alert.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Vaqt</span>
              <p className="text-sm font-mono">{moment(alert.timestamp).format("YYYY-MM-DD HH:mm:ss")}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Holat</span>
              <div>
                <Badge variant="outline" className="capitalize">{alert.status}</Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Manba IP</span>
              <p className="text-sm font-mono">{alert.source_ip || "Aniqlanmagan"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Manzil IP</span>
              <p className="text-sm font-mono">{alert.target_ip || "Ichki tarmoq"}</p>
            </div>
          </div>

          {alert.risk_score && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground uppercase font-semibold">Risk skori</span>
                <span className={cn("font-bold", alert.risk_score > 70 ? "text-destructive" : "text-primary")}>{alert.risk_score}%</span>
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all", alert.risk_score > 70 ? "bg-destructive" : "bg-primary")} 
                  style={{ width: `${Math.min(100, Math.max(0, alert.risk_score))}%` }} 
                />
              </div>
            </div>
          )}
        </div>

        {alert.status === 'active' && (
          <DialogFooter className="mt-6 flex gap-2 border-t border-border pt-4 sm:justify-start">
            <Button size="sm" variant="default" disabled={loading} onClick={() => handleStatusUpdate('resolved')}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Hal qilish
            </Button>
            <Button size="sm" variant="outline" disabled={loading} onClick={() => handleStatusUpdate('investigating')}>
              <Search className="h-4 w-4 mr-2" />
              Tekshirish
            </Button>
            <Button size="sm" variant="secondary" className="text-muted-foreground" disabled={loading} onClick={() => handleStatusUpdate('false_positive')}>
              <ShieldX className="h-4 w-4 mr-2" />
              Noto'g'ri (Ignore)
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}