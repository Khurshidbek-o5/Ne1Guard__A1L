import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, subValue, trend, variant = "default" }) {
  const variants = {
    default: "border-border",
    success: "border-primary/20 glow-green",
    warning: "border-chart-3/20 glow-amber",
    danger: "border-destructive/20 glow-red",
    info: "border-accent/20 glow-blue",
  };

  const iconVariants = {
    default: "bg-secondary text-foreground",
    success: "bg-primary/10 text-primary",
    warning: "bg-chart-3/10 text-chart-3",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-accent/10 text-accent",
  };

  return (
    <div className={cn(
      "bg-card border rounded-xl p-5 transition-all duration-300 hover:translate-y-[-2px]",
      variants[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <div>
            <p className="text-2xl font-bold tracking-tight font-mono">{value}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
            )}
          </div>
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", iconVariants[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-border">
          <span className={cn(
            "text-xs font-medium font-mono",
            trend >= 0 ? "text-primary" : "text-destructive"
          )}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-muted-foreground ml-1.5">so'nggi 24 soat</span>
        </div>
      )}
    </div>
  );
}