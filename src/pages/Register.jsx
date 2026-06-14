import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Shield, Lock, Mail, Eye, EyeOff, Loader2, Cpu, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanPosition, setScanPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanPosition((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
    } catch (err) {
      setError(err.message || 'Registratsiya xatoligi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(222,28%,3%)] text-foreground flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
      <div className="absolute left-10 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
      <div className="absolute right-10 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent/20 to-transparent" />

      <div className="relative z-10 w-full max-w-lg px-6 py-10 my-10 max-h-screen overflow-y-auto custom-scrollbar">
        
        <div className="flex flex-col items-center mb-8 pt-4">
          <div className="relative mb-6 group">
            <div className="absolute inset-0 border border-primary/40 rotate-45 rounded-lg scale-110 group-hover:rotate-90 transition-transform duration-700" />
            <div className="w-16 h-16 bg-background/50 backdrop-blur-xl border border-primary/50 relative flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <div 
                className="absolute left-0 w-full h-[1px] bg-primary/80 shadow-[0_0_5px_theme(colors.primary.DEFAULT)] z-10" 
                style={{ top: `${scanPosition}%` }} 
              />
              <Shield className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-widest uppercase mb-1">
            NetGuard<span className="text-primary font-mono ml-1">AI</span>
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
             <p className="text-xs font-mono tracking-[0.2em] uppercase">New Operator Registry</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-[2px] bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 rounded-2xl opacity-50 blur-sm" />
          
          <div className="relative bg-[#0b1121]/90 backdrop-blur-3xl border border-border/60 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
               <div>
                 <h2 className="text-xl font-bold font-mono text-foreground uppercase tracking-wider">Registration</h2>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Create Access Identity</p>
               </div>
               <UserIcon className="h-8 w-8 text-primary/40" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Full Name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Operator Name"
                  className="w-full bg-background/50 border border-border/80 rounded-lg px-4 py-3 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Agent Identity (Email)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="user@netguard.local"
                    className="w-full bg-background/50 border border-border/80 rounded-lg pl-11 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Passphrase</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••••••"
                    className="w-full bg-background/50 border border-border/80 rounded-lg pl-11 pr-11 py-3 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono tracking-widest"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-primary transition-colors">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/40 rounded-lg p-3 flex items-start gap-3">
                  <p className="text-xs text-destructive font-mono leading-tight">{error}</p>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className={cn(
                  "relative w-full h-12 mt-4 bg-primary/10 border border-primary text-primary hover:bg-primary/20 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all rounded-lg font-mono font-bold tracking-widest uppercase overflow-hidden group",
                  loading && "opacity-70 pointer-events-none"
                )}
              >
                <div className="relative flex items-center justify-center gap-3 w-full h-full">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" />REGISTERING...</> : <><Cpu className="w-5 h-5" />CREATE IDENTITY</>}
                </div>
              </button>
            </form>

            <div className="mt-6 text-center">
               <Link to="/login" className="text-xs font-mono text-primary/70 hover:text-primary hover:underline transition-colors">
                 O'zingizni tanitganmisiz? Login ekraniga qaytish
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
