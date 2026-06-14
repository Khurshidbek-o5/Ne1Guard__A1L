import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PageNotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-destructive/10 blur-3xl rounded-full" />
        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive animate-pulse">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground font-mono text-xs font-bold px-2 py-1 rounded border border-destructive/50 shadow-lg">
          404
        </div>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Sahifa Topilmadi</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Siz so'ragan sahifa mavjud emas yoki kirish huquqingiz yo'q. Iltimos, manzillarni tekshirib ko'ring.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="min-w-[140px]">
          <ArrowLeft className="w-4 h-4 mr-2" /> Orqaga
        </Button>
        <Button onClick={() => navigate("/")} className="min-w-[140px]">
          <Home className="w-4 h-4 mr-2" /> Dashboard
        </Button>
      </div>

      <div className="mt-12 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] opacity-50">
        NetGuard AI // Protection System // Error Code: 0x404
      </div>
    </div>
  );
}