import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import moment from "moment";

const levelStyles = {
  INFO:  "text-primary/80",
  WARN:  "text-chart-3",
  ERROR: "text-destructive",
  DEBUG: "text-muted-foreground",
};

const levelBg = {
  INFO:  "bg-primary/10 text-primary",
  WARN:  "bg-chart-3/10 text-chart-3",
  ERROR: "bg-destructive/10 text-destructive",
  DEBUG: "bg-secondary text-muted-foreground",
};

export default function LiveLogStream({ logs, maxHeight = 320 }) {
  const containerRef = useRef(null);
  const isUserScrolledRef = useRef(false);

  useEffect(() => {
    if (!isUserScrolledRef.current && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [logs]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (el) {
      isUserScrolledRef.current = el.scrollTop > 50;
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-y-auto font-mono text-xs space-y-0.5"
      style={{ maxHeight }}
    >
      {logs.map((log, idx) => (
        <div
          key={log.id}
          className={cn(
            "flex items-start gap-2 px-3 py-1.5 rounded transition-all",
            idx === 0 ? "bg-secondary/80 animate-in fade-in slide-in-from-top-1 duration-300" : "hover:bg-secondary/30"
          )}
        >
          <span className="text-muted-foreground/50 shrink-0 tabular-nums">
            {moment(log.timestamp).format("HH:mm:ss.SSS")}
          </span>
          <span className={cn("shrink-0 px-1.5 py-0 rounded text-[9px] font-bold uppercase", levelBg[log.level])}>
            {log.level}
          </span>
          <span className="text-[10px] text-chart-2/60 shrink-0">[{log.source}]</span>
          <span className={cn("flex-1 break-all", levelStyles[log.level])}>
            {log.message}
          </span>
        </div>
      ))}
    </div>
  );
}