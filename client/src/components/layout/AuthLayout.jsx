import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { ROUTES } from '../../constants/routes.js';

const LOGO_URL = '/verixsoft-logo.png';
const BRAND = '#1B2A4A';

function Logo({ className = 'h-9 w-auto' }) {
  return (
    <img
      src={LOGO_URL}
      alt="Verixsoft"
      className={`${className} select-none object-contain`}
      onError={(e) => {
        e.currentTarget.src = 'https://verixsoft.com/icon.png';
      }}
    />
  );
}

/**
 * Branded split-screen shell for all auth pages (login / forgot / reset).
 * Desktop (>=lg): 55% brand panel + 45% form panel.
 * Mobile: brand panel collapses to a small logo header strip; form is full width.
 */
export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-950 lg:grid lg:grid-cols-[55fr_45fr]">
      {/* ── Left: branded panel (desktop) ── */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
        style={{ backgroundColor: BRAND }}
      >
        {/* abstract gradient glows */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-[130px]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <Logo className="h-10 w-auto" />
          <span className="text-xl font-bold tracking-tight">Verixsoft CRM</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Run your software house, end to end.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Clients, leads, projects, tasks, invoices, and your team — together in one
            workspace.
          </p>
        </div>

        <p className="relative z-10 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Verixsoft. All rights reserved.
        </p>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex min-h-screen flex-col lg:min-h-0">
        {/* mobile logo strip */}
        <div
          className="flex items-center gap-2 px-6 py-4 text-white lg:hidden"
          style={{ backgroundColor: BRAND }}
        >
          <Logo className="h-7 w-auto" />
          <span className="text-base font-bold tracking-tight">Verixsoft CRM</span>
        </div>

        <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
