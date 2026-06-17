import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, clearCredentials } from '../../features/auth/authSlice.js';
import { useLogoutMutation } from '../../services/authApi.js';
import { LayoutDashboard, FolderKanban, Receipt, MessagesSquare, LogOut, Menu, X } from 'lucide-react';

const NAV = [
  { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portal/projects', label: 'Projects', icon: FolderKanban },
  { to: '/portal/invoices', label: 'Invoices', icon: Receipt },
  { to: '/portal/messages', label: 'Messages', icon: MessagesSquare },
];

export default function PortalLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [logoutApi] = useLogoutMutation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials =
    `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'C';

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // clear client session regardless
    }
    dispatch(clearCredentials());
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? 'bg-white/15 text-white' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Premium top bar */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#0f1f3d] via-[#16284d] to-[#1b2a4a] text-white shadow-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <img
                src="/verixsoft-logo.png"
                alt="Verixsoft"
                className="h-6 w-6 select-none object-contain"
              />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold">Client Portal</p>
              <p className="text-[11px] text-blue-200/70">VerixSoft</p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
                {initials}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-blue-200/70">Client</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="hidden items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 sm:flex"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
            <button
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="space-y-1 border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={linkClass}
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-blue-100/80 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
