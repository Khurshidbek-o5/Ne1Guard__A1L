import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

export default function ScoreGauge({ score }) {
  const { t } = useTranslation();
  
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";
  const label = score >= 80 ? t('common.good') || "YAXSHI" 
              : score >= 60 ? t('common.medium') || "O'RTA" 
              : score >= 40 ? t('common.risky') || "XAVFLI" 
              : t('common.critical') || "KRITIK";
              
  const r = 58;
  const circ = 2 * Math.PI * r;
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
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold font-mono" style={{ color }}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <Badge 
        style={{ backgroundColor: color + "20", color, borderColor: color + "40" }}
        className="text-xs font-bold uppercase border"
      >
        {label}
      </Badge>
    </div>
  );
}
