import { useState } from "react";
import { apiClient } from "@/api/apiClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function AddDeviceDialog({ open, onOpenChange, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    hostname: "", ip_address: "", mac_address: "",
    device_type: "workstation", status: "online",
    risk_level: "safe",
  });

  const handleSubmit = async () => {
    if (!form.hostname || !form.ip_address || !form.mac_address) {
      toast({ title: "Xatolik", description: "Majburiy maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiClient.createDevice(form);
      setLoading(false);
      onOpenChange(false);
      setForm({ hostname: "", ip_address: "", mac_address: "", device_type: "workstation", status: "online", risk_level: "safe" });
      toast({ title: "Qurilma qo'shildi" });
      onComplete?.();
    } catch (err) {
      console.error("Failed to add device:", err);
      setLoading(false);
      toast({ title: "Xatolik", description: "Qurilmani saqlashda xatolik yuz berdi", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yangi Qurilma Qo'shish (Database)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div>
            <Label className="text-xs">Hostname *</Label>
            <Input value={form.hostname} onChange={e => setForm({...form, hostname: e.target.value})} placeholder="my-server" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">IP Address *</Label>
              <Input value={form.ip_address} onChange={e => setForm({...form, ip_address: e.target.value})} placeholder="192.168.1.10" />
            </div>
            <div>
              <Label className="text-xs">MAC Address *</Label>
              <Input value={form.mac_address} onChange={e => setForm({...form, mac_address: e.target.value})} placeholder="AA:BB:CC:DD:EE:FF" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Turi</Label>
            <Select value={form.device_type} onValueChange={v => setForm({...form, device_type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["router","switch","server","workstation","mobile","iot","printer","unknown"].map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            Qo'shish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}