import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import useAuth from '../../hooks/useAuth.js';
import { clearCredentials } from '../../features/auth/authSlice.js';
import { useLogoutMutation } from '../../services/authApi.js';
import { cn } from '../../lib/utils.js';
import { Button } from '../ui/button.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.jsx';
import { Badge } from '../ui/badge.jsx';
import {
  LayoutDashboard,
  CheckSquare,
  User,
  Building2,
  TrendingUp,
  FolderKanban,
  Receipt,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity,
  X,
  MessageSquare,
  Calendar,
  BarChart3,
  Cpu,
  Radio,
  History,
  UserCheck,
  FileText,
} from 'lucide-react';
import { useGetTasksQuery } from '../../services/tasksApi.js';
import { useGetChannelsQuery } from '../../services/chatApi.js';

export default function Sidebar({
  isCollapsed,
  toggleSidebar,
  isMobileOpen,
  closeMobile,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, role } = useAuth();
  const [logoutApi] = useLogoutMutation();

  // RTK Query hooks for badges
  // "My Tasks" badge counts only the user's own overdue tasks (scope=mine).
  const { data: tasksData } = useGetTasksQuery({ scope: 'mine' }, { skip: !user });
  const { data: channelsData } = useGetChannelsQuery(undefined, { skip: !user });

  // Calculate overdue tasks count
  const tasks = tasksData?.data || [];
  const overdueCount = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  // Sum unread counts from channels
  const channels = channelsData?.data || [];
  const unreadChatCount = Array.isArray(channels)
    ? channels.reduce((sum, ch) => sum + (ch.unreadCount || 0), 0)
    : 0;

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Ignored: cleanup client anyway
    }
    dispatch(clearCredentials());
    navigate('/login');
  };

  const isRoleAllowed = (allowedRoles) => {
    if (allowedRoles === 'all') return true;
    if (!role) return false;
    return allowedRoles.includes(role);
  };

  const menuItems = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      roles: 'all',
    },
    {
      label: 'My Tasks',
      to: '/tasks',
      icon: CheckSquare,
      roles: 'all',
      badge: overdueCount > 0 ? overdueCount : null,
      badgeVariant: 'destructive',
    },
    {
      label: 'Projects',
      to: '/projects',
      icon: FolderKanban,
      roles: 'all',
    },
    {
      label: 'Chat',
      to: '/chat',
      icon: MessageSquare,
      roles: 'all',
      badge: unreadChatCount > 0 ? unreadChatCount : null,
      badgeVariant: 'default',
    },
    {
      label: 'Profile',
      to: '/profile',
      icon: User,
      roles: 'all',
    },
    {
      label: 'Clients',
      to: '/clients',
      icon: Building2,
      roles: ['super_admin', 'admin', 'manager'],
    },
    {
      label: 'Leads',
      to: '/leads',
      icon: TrendingUp,
      roles: ['super_admin', 'admin', 'manager'],
      // Managers only see Leads if they are a lead-type manager.
      canView: (u) => u?.role !== 'manager' || u?.managerType === 'lead_manager',
    },
    {
      label: 'Invoices',
      to: '/invoices',
      icon: Receipt,
      roles: ['super_admin', 'admin', 'manager'],
    },
    {
      label: 'Team Directory',
      to: '/team',
      icon: Users,
      roles: ['super_admin', 'admin', 'manager'],
    },
    {
      label: 'Attendance',
      to: '/attendance',
      icon: Calendar,
      roles: ['super_admin', 'admin', 'manager'],
    },
    {
      label: 'Reports',
      to: '/reports',
      icon: BarChart3,
      roles: ['super_admin', 'admin', 'manager'],
    },
    {
      label: 'Proposals',
      to: '/proposals/new',
      icon: FileText,
      roles: ['super_admin', 'admin', 'manager'],
    },
    {
      label: 'Employees',
      to: '/employees',
      icon: UserCheck,
      roles: ['super_admin', 'admin', 'manager'],
      // Among managers, only hiring managers get the staff-management page;
      // other managers use the read-only Team Directory instead.
      canView: (u) => u?.role !== 'manager' || u?.managerType === 'hiring_manager',
    },
    {
      label: 'AI Tools',
      to: '/tools/email-writer',
      icon: Cpu,
      roles: ['super_admin', 'admin'],
    },
    {
      label: 'Presence',
      to: '/admin/presence',
      icon: Radio,
      roles: ['super_admin', 'admin'],
    },
    {
      label: 'Activity Monitor',
      to: '/admin/activity',
      icon: History,
      roles: ['super_admin'],
    },
    {
      label: 'System Settings',
      to: '/settings',
      icon: Settings,
      roles: ['super_admin', 'admin'],
    },
  ];

  const filteredItems = menuItems.filter((item) => {
    if (!isRoleAllowed(item.roles)) return false;
    if (item.canView && !item.canView(user)) return false;
    // Show mobile-only items only when mobile sidebar is open
    if (item.mobileOnly && !isMobileOpen) return false;
    return true;
  });

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const getRoleLabel = (r) => {
    if (!r) return '';
    return r.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleNavClick = () => {
    if (isMobileOpen && closeMobile) closeMobile();
  };

  const sidebarContent = (
    <aside
      className={cn(
        'h-full flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 transition-all duration-300 z-30 shrink-0',
        // Desktop & Tablet
        'hidden md:flex',
        isCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Brand logo header */}
      <div
        className={cn(
          'h-16 flex items-center px-6 gap-2 select-none border-b border-slate-800/60',
          isCollapsed && 'justify-center px-0'
        )}
      >
        <Activity className="h-6 w-6 text-blue-500 shrink-0" />
        {!isCollapsed && (
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Verixsoft CRM
          </span>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-6 space-y-1 sidebar-nav">
        {filteredItems.map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              style={{ padding: '16px 12px' }}
              className={cn(
                'flex items-center gap-3 rounded-[8px] text-sm font-medium transition-all group relative',
                active
                  ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-900/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform',
                  !active && 'group-hover:scale-110'
                )}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && item.badge && (
                <Badge variant={item.badgeVariant || 'default'} className="ml-auto shrink-0">
                  {item.badge}
                </Badge>
              )}

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-950 text-slate-200 text-xs font-semibold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile / Control Section */}
      <div className="sidebar-user-badge flex-col gap-4">
        {/* User Card */}
        {user && !isCollapsed && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 border border-slate-800/50">
            <Avatar className="h-10 w-10 border border-slate-700/50">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-slate-700 text-slate-200 font-semibold uppercase">
                {user.name?.slice(0, 2) || 'US'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-100 truncate">{user.name}</p>
              <Badge
                variant="outline"
                className="mt-1 text-[10px] py-0 px-1.5 border-slate-700 text-slate-400 capitalize"
              >
                {getRoleLabel(role)}
              </Badge>
            </div>
          </div>
        )}

        {/* Collapsed user avatar */}
        {user && isCollapsed && (
          <div className="flex justify-center group relative">
            <Avatar className="h-10 w-10 border border-slate-700/50">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-slate-700 text-slate-200 font-semibold uppercase">
                {user.name?.slice(0, 2) || 'US'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute left-full ml-3 px-2 py-1 bg-slate-950 text-slate-200 text-xs font-semibold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              {user.name} · {getRoleLabel(role)}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className={cn('flex flex-col gap-2', isCollapsed && 'items-center')}>
          {/* Expand/Collapse Toggle Button */}
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            className="w-full text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 justify-start h-9 px-3 gap-3"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">Collapse Menu</span>
              </>
            )}
          </Button>

          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-rose-400 hover:text-rose-200 hover:bg-rose-950/20 justify-start h-9 px-3 gap-3"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  );

  // Mobile sidebar overlay
  const mobileSidebar = (
    <>
      {/* Backdrop */}
      {isMobileOpen && (
        // Decorative dismiss overlay; keyboard users close via Escape or the close button.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile sidebar panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-[260px] flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 z-50 md:hidden transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header with close */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500 shrink-0" />
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Verixsoft CRM
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobile}
            className="text-slate-400 hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 sidebar-nav">
          {menuItems
            .filter((item) => isRoleAllowed(item.roles) && (!item.canView || item.canView(user)))
            .map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  style={{ padding: '16px 12px' }}
                  className={cn(
                    'flex items-center gap-3 rounded-[8px] text-sm font-medium transition-all',
                    active
                      ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-900/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant={item.badgeVariant || 'default'} className="ml-auto shrink-0">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* Bottom section */}
        <div className="sidebar-user-badge flex-col gap-4">
          {user && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 border border-slate-800/50">
              <Avatar className="h-10 w-10 border border-slate-700/50">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="bg-slate-700 text-slate-200 font-semibold uppercase">
                  {user.name?.slice(0, 2) || 'US'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-100 truncate">{user.name}</p>
                <Badge
                  variant="outline"
                  className="mt-1 text-[10px] py-0 px-1.5 border-slate-700 text-slate-400 capitalize"
                >
                  {getRoleLabel(role)}
                </Badge>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-rose-400 hover:text-rose-200 hover:bg-rose-950/20 justify-start h-9 px-3 gap-3"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );

  return (
    <>
      {sidebarContent}
      {mobileSidebar}
    </>
  );
}
