import { Calculator, DollarSign, TrendingUp } from 'lucide-react';

export default function AccountantPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hisob-kitob (Accountant) Paneli</h1>
        <p className="text-sm text-muted-foreground mt-1">Moliyaviy operatsiyalar va oyliklarni boshqarish markazi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
           <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-semibold">Tushum (Shu oy)</span>
              <DollarSign className="w-4 h-4 text-primary" />
           </div>
           <p className="text-3xl font-bold font-mono mt-2">$24,500</p>
           <p className="text-xs text-primary flex items-center gap-1 mt-2">
             <TrendingUp className="w-3 h-3" /> +12% o'tgan oydan
           </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
           <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-semibold">Xarajatlar (Shu oy)</span>
              <Calculator className="w-4 h-4 text-accent" />
           </div>
           <p className="text-3xl font-bold font-mono mt-2">$8,240</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">So'nggi harakatlar</h3>
        <p className="text-sm text-muted-foreground text-center py-8">Ma'lumot topilmadi. Fake API...</p>
      </div>
    </div>
  );
}
