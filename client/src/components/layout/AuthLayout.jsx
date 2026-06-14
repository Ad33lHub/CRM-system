import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { ROUTES } from '../../constants/routes.js';
import { Activity } from 'lucide-react';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-100 relative overflow-hidden">
      {/* Decorative gradient glowing spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Header Logo */}
      <header className="p-6 flex items-center gap-2 select-none z-10">
        <Activity className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Verixsoft CRM
        </span>
      </header>

      {/* Centered Outlet */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 z-10 border-t border-slate-900/80">
        &copy; {new Date().getFullYear()} Verixsoft. All rights reserved.
      </footer>
    </div>
  );
}
