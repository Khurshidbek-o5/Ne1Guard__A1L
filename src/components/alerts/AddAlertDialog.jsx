import { useState } from "react";
import { apiClient } from "@/api/apiClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function AddAlertDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState({
    type: "port_scan",
    source_ip: "",
    target_ip: "",
    severity: "medium",
    status: "active",
    description: "",
    risk_score: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.source_ip || !form.description) {
      toast({ title: "Xatolik", description: "Manba IP va tavsifni kiriting", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiClient.createAlert({
        ...form,
        risk_score: form.risk_score ? Number(form.risk_score) : null,
      });
      toast({ title: "Alert yaratildi", description: "Yangi ogohlantirish muvaffaqiyatli qo'shildi" });
      setForm({ type: "port_scan", source_ip: "", target_ip: "", severity: "medium", status: "active", description: "", risk_score: "" });
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      console.error("Failed to create alert:", err);
      toast({ title: "Xatolik", description: "Ogohlantirishni saqlashda xatolik", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yangi Ogohlantirish Yaratish</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Hujum Turi *</Label>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["port_scan", "brute_force", "arp_spoofing", "ddos", "malware", "intrusion", "data_exfiltration", "other"].map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Xavf Darajasi *</Label>
              <Select value={form.severity} onValueChange={v => setForm({...form, severity: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "critical"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Manba IP *</Label>
              <Input placeholder="192.168.1.10" value={form.source_ip} onChange={e => setForm({...form, source_ip: e.target.value})} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Manzil IP</Label>
              <Input placeholder="192.168.1.1" value={form.target_ip} onChange={e => setForm({...form, target_ip: e.target.value})} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Risk Skori (0-100)</Label>
              <Input type="number" min="0" max="100" placeholder="75" value={form.risk_score} onChange={e => setForm({...form, risk_score: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tavsif *</Label>
            <Textarea placeholder="Ogohlantirish tavsifi..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {saving ? "Saqlanmoqda..." : "Yaratish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}