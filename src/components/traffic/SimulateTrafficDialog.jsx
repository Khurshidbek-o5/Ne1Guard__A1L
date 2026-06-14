import { useState } from "react";
import { apiClient } from "@/api/apiClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Zap } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const scenarios = [
  { value: "normal", label: "Normal Trafik", desc: "Oddiy tarmoq faoliyati" },
  { value: "port_scan", label: "Port Scanning Hujumi", desc: "Bir IP dan ko'p portga SYN yuborilishi" },
  { value: "brute_force", label: "Brute Force Hujumi", desc: "SSH/FTP ga ko'p login urinishlari" },
  { value: "arp_spoof", label: "ARP Spoofing", desc: "MAC address o'zgarishi" },
  { value: "ddos", label: "DDoS Hujumi", desc: "Massiv trafik yuborish" },
];

function generatePackets(scenario) {
  const packets = [];
  const randomIP = () => `192.168.1.${Math.floor(Math.random() * 254) + 1}`;

  if (scenario === "normal") {
    for (let i = 0; i < 5; i++) {
      packets.push({
        source_ip: randomIP(), destination_ip: randomIP(),
        port: [80, 443, 8080, 53, 22][Math.floor(Math.random() * 5)],
        protocol: ["TCP", "HTTP", "HTTPS", "DNS"][Math.floor(Math.random() * 4)],
        size: Math.floor(Math.random() * 1500 + 64), status: "normal",
      });
    }
  } else if (scenario === "port_scan") {
    const attackerIP = "10.0.0.99";
    const targetIP = randomIP();
    for (let i = 0; i < 10; i++) {
      packets.push({
        source_ip: attackerIP, destination_ip: targetIP,
        port: Math.floor(Math.random() * 65535),
        protocol: "TCP", size: 64, status: "attack",
      });
    }
  } else {
    // Other simple attack simulations
    for (let i = 0; i < 5; i++) {
      packets.push({
        source_ip: scenario === 'arp_spoof' ? '192.168.1.100' : '10.0.0.55',
        destination_ip: randomIP(),
        port: scenario === 'brute_force' ? 22 : 80,
        protocol: scenario === 'brute_force' ? 'SSH' : 'TCP',
        size: 500, status: "attack",
      });
    }
  }
  return packets;
}

export default function SimulateTrafficDialog({ open, onOpenChange, onComplete }) {
  const [scenario, setScenario] = useState("normal");
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const packets = generatePackets(scenario);
      
      // Post all packets to backend
      for (const p of packets) {
        await apiClient.createPacket(p);
      }

      setLoading(false);
      onOpenChange(false);
      toast({ title: "Simulyatsiya yakunlandi", description: `${packets.length} paket bazaga saqlandi` });
      onComplete?.();
    } catch (err) {
      console.error("Simulation failed:", err);
      setLoading(false);
      toast({ title: "Xatolik", description: "Simulyatsiya ma'lumotlarini saqlashda xato", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Tarmoq Simulyatsiyasi (Database)
          </DialogTitle>
          <DialogDescription>
            Hujum turini tanlang va ma'lumotlar bazasini to'ldiring
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Select value={scenario} onValueChange={setScenario}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  <div>
                    <p className="font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
          <Button onClick={handleSimulate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Zap className="h-4 w-4 mr-1.5" />}
            Simulyatsiya qilish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}