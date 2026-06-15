import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import TopBar from '../common/TopBar.jsx';
import BreakpointIndicator from '../dev/BreakpointIndicator.jsx';
import useSocket from '../../hooks/useSocket.js';
import { SIDEBAR } from '../../constants/layout.js';

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR.STORAGE_KEY) === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Connect Socket.IO on app layout mount
  useSocket();

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR.STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const openMobileSidebar = useCallback(() => setIsMobileOpen(true), []);
  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);

  // Close mobile sidebar on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isMobileOpen) closeMobileSidebar();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isMobileOpen, closeMobileSidebar]);

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        isMobileOpen={isMobileOpen}
        closeMobile={closeMobileSidebar}
      />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative overflow-hidden">
        {/* TopBar */}
        <TopBar openMobileSidebar={openMobileSidebar} />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto bg-[#0f172a]" style={{ padding: '32px 40px' }}>
          <Outlet />
        </main>
      </div>

      {/* Dev breakpoint indicator */}
      {import.meta.env.DEV && <BreakpointIndicator />}
    </div>
  );
}
