import { useAuth } from '@/lib/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4">
        <div className="w-20 h-20 bg-destructive/10 border border-destructive/30 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="w-10 h-10 text-destructive animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-widest font-mono text-destructive uppercase">Access Denied</h1>
        <p className="text-muted-foreground font-mono text-sm max-w-md">
          Ushbu sahifaga kirish uchun sizning rolingiz ( <span className="text-primary">{user?.role || 'user'}</span> ) mos kelmaydi. Ruxsat cheklangan.
        </p>
        <Button variant="outline" className="mt-4 border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => navigate('/')}>
          Ortga (Dashboard) ga qaytish
        </Button>
      </div>
    );
  }

  return children;
}
