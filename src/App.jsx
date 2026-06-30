import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import TrafficMonitor from './pages/TrafficMonitor';
import Alerts from './pages/Alerts';
import Devices from './pages/Devices';
import AIAnalysis from './pages/AIAnalysis';
import NetworkMap from './pages/NetworkMap';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/Login';
import Register from './pages/Register';
import PrinterPanel from './pages/PrinterPanel';
import ActiveDirectoryPanel from './pages/ActiveDirectoryPanel';
import ProtectedRoute from './components/ProtectedRoute';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, user } = useAuth();

  // Show loading spinner while checking auth for the first time
  if (isLoadingAuth && !isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-mono animate-pulse">Tizim tekshirilmoqda...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login or register page
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Standalone full-screen pages (no AppLayout sidebar/header) */}
      <Route path="/ad-admin" element={
        <ProtectedRoute allowedRoles={['developer']}>
          <ActiveDirectoryPanel />
        </ProtectedRoute>
      } />

      {/* Main app with sidebar/header layout */}
      <Route element={<AppLayout />}>
        {/* Dashboard - All approved roles + guest */}
        <Route path="/" element={
           <ProtectedRoute allowedRoles={['developer', 'security', 'support', 'user', 'printer', 'auditor', 'guest']}>
             <Dashboard />
           </ProtectedRoute>
        } />

        <Route path="/traffic" element={
          <ProtectedRoute allowedRoles={['developer', 'support', 'user', 'security']}>
            <TrafficMonitor />
          </ProtectedRoute>
        } />

        <Route path="/alerts" element={
          <ProtectedRoute allowedRoles={['developer', 'support', 'security', 'auditor']}>
            <Alerts />
          </ProtectedRoute>
        } />

        <Route path="/devices" element={
          <ProtectedRoute allowedRoles={['developer', 'auditor']}>
            <Devices />
          </ProtectedRoute>
        } />

        <Route path="/map" element={
          <ProtectedRoute allowedRoles={['developer', 'support']}>
            <NetworkMap />
          </ProtectedRoute>
        } />

        <Route path="/ai-analysis" element={
          <ProtectedRoute allowedRoles={['developer', 'support', 'security']}>
            <AIAnalysis />
          </ProtectedRoute>
        } />
        
        {/* Printer ONLY */}
        <Route path="/printer" element={
          <ProtectedRoute allowedRoles={['developer', 'printer']}>
            <PrinterPanel />
          </ProtectedRoute>
        } />

        {/* Profile / Settings - Everyone, including Guest (internal logic handles tabs) */}
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['developer', 'security', 'support', 'user', 'printer', 'auditor', 'guest']}>
            <SettingsPage />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App;