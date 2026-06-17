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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu.jsx';
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
  X,
  MessageSquare,
  Calendar,
  BarChart3,
  Cpu,
  History,
  UserCheck,
  FileText,
  MoreVertical,
} from 'lucide-react';
import { useGetTasksQuery } from '../../services/tasksApi.js';
import { useGetChannelsQuery } from '../../services/chatApi.js';

const ITEM_BASE =
  'group relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors duration-150';
const ITEM_ACTIVE = 'bg-blue-500/10 text-blue-400';
const ITEM_INACTIVE = 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100';

export default function Sidebar({ isCollapsed, toggleSidebar, isMobileOpen, closeMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, role } = useAuth();
  const [logoutApi] = useLogoutMutation();

  // RTK Query hooks for badges.
  // "My Tasks" badge counts only the user's own overdue tasks (scope=mine).
  const { data: tasksData } = useGetTasksQuery({ scope: 'mine' }, { skip: !user });
  const { data: channelsData } = useGetChannelsQuery(undefined, { skip: !user });

  const tasks = tasksData?.data || [];
  const overdueCount = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  const channels = channelsData?.data || [];
  const unreadChatCount = Array.isArray(channels)
    ? channels.reduce((sum, ch) => sum + (ch.unreadCount || 0), 0)
    : 0;

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Ignored: clean up client state anyway.
    }
    dispatch(clearCredentials());
    navigate('/login');
  };

  const isRoleAllowed = (allowedRoles) => {
    if (allowedRoles === 'all') return true;
    if (!role) return false;
    return allowedRoles.includes(role);
  };

  // Same items / roles / destinations as before — grouped only for presentation.
  const MANAGERS = ['super_admin', 'admin', 'manager'];
  const navGroups = [
    {
      label: 'Main',
      items: [
        { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: 'all' },
        {
          label: 'My Tasks',
          to: '/tasks',
          icon: CheckSquare,
          roles: 'all',
          badge: overdueCount > 0 ? overdueCount : null,
          badgeVariant: 'destructive',
        },
        { label: 'Projects', to: '/projects', icon: FolderKanban, roles: 'all' },
        {
          label: 'Chat',
          to: '/chat',
          icon: MessageSquare,
          roles: 'all',
          badge: unreadChatCount > 0 ? unreadChatCount : null,
          badgeVariant: 'default',
        },
        { label: 'Profile', to: '/profile', icon: User, roles: 'all' },
      ],
    },
    {
      label: 'Management',
      items: [
        { label: 'Client Messages', to: '/client-messages', icon: MessageSquare, roles: MANAGERS },
        { label: 'Clients', to: '/clients', icon: Building2, roles: MANAGERS },
        {
          label: 'Leads',
          to: '/leads',
          icon: TrendingUp,
          roles: MANAGERS,
          // Managers only see Leads if they are a lead-type manager.
          canView: (u) => u?.role !== 'manager' || u?.managerType === 'lead_manager',
        },
        { label: 'Invoices', to: '/invoices', icon: Receipt, roles: MANAGERS },
        { label: 'Team Directory', to: '/team', icon: Users, roles: MANAGERS },
        { label: 'Attendance', to: '/attendance', icon: Calendar, roles: MANAGERS },
        { label: 'Reports', to: '/reports', icon: BarChart3, roles: MANAGERS },
        { label: 'Proposals', to: '/proposals/new', icon: FileText, roles: MANAGERS },
        {
          label: 'Employees',
          to: '/employees',
          icon: UserCheck,
          roles: MANAGERS,
          // Among managers, only hiring managers get the staff-management page.
          canView: (u) => u?.role !== 'manager' || u?.managerType === 'hiring_manager',
        },
      ],
    },
    {
      label: 'Admin',
      items: [
        { label: 'AI Tools', to: '/tools/email-writer', icon: Cpu, roles: ['super_admin', 'admin'] },
        { label: 'Activity Monitor', to: '/admin/activity', icon: History, roles: ['super_admin'] },
        { label: 'System Settings', to: '/settings', icon: Settings, roles: ['super_admin'] },
      ],
    },
  ];

  const itemVisible = (item) =>
    isRoleAllowed(item.roles) && (!item.canView || item.canView(user));

  const isActive = (path) =>
    path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(path);

  const getRoleLabel = (r) =>
    r ? r.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';

  const canSeeSettings = role === 'super_admin';

  // ── Renderers (shared by desktop + mobile) ──
  const renderItem = (item, collapsed, onClick) => {
    const Icon = item.icon;
    const active = isActive(item.to);
    const link = (
      <Link
        key={item.to}
        to={item.to}
        onClick={onClick}
        className={cn(ITEM_BASE, collapsed ? 'justify-center px-0' : 'px-3', active ? ITEM_ACTIVE : ITEM_INACTIVE)}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-500" />
        )}
        <span className="relative flex items-center justify-center">
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          {collapsed && item.badge != null && (
            <span
              className={cn(
                'absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full ring-2 ring-slate-900',
                item.badgeVariant === 'destructive' ? 'bg-rose-500' : 'bg-blue-400'
              )}
            />
          )}
        </span>
        {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
        {!collapsed && item.badge != null && (
          <Badge
            variant={item.badgeVariant || 'default'}
            className="ml-auto h-5 min-w-5 shrink-0 justify-center px-1.5"
          >
            {item.badge}
          </Badge>
        )}
      </Link>
    );

    if (!collapsed) return link;
    return (
      <Tooltip key={item.to}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">
          {item.label}
          {item.badge != null ? ` · ${item.badge}` : ''}
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderNav = (collapsed, onClick) => (
    <nav className="sidebar-nav flex-1 space-y-1 px-3 py-4">
      {navGroups.map((group, idx) => {
        const items = group.items.filter(itemVisible);
        if (!items.length) return null;
        return (
          <div key={group.label} className="space-y-1">
            {collapsed ? (
              idx > 0 && <div className="mx-auto my-3 h-px w-8 bg-slate-800" />
            ) : (
              <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
            )}
            {items.map((item) => renderItem(item, collapsed, onClick))}
          </div>
        );
      })}
    </nav>
  );

  const renderUserMenu = (collapsed, onAfterNav) => {
    if (!user) return null;
    const initials = user.name?.slice(0, 2)?.toUpperCase() || 'US';
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-800/60',
              collapsed ? 'justify-center' : 'w-full'
            )}
          >
            <Avatar className="h-9 w-9 border border-slate-700/50">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-slate-700 font-semibold uppercase text-slate-200">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-100">{user.name}</p>
                  <p className="truncate text-[11px] capitalize text-slate-400">
                    {getRoleLabel(role)}
                  </p>
                </div>
                <MoreVertical className="h-4 w-4 shrink-0 text-slate-500" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align={collapsed ? 'center' : 'end'} className="w-52">
          <DropdownMenuLabel className="truncate">{user.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              navigate('/profile');
              onAfterNav?.();
            }}
          >
            <User className="h-4 w-4" />
            Profile
          </DropdownMenuItem>
          {canSeeSettings && (
            <DropdownMenuItem
              onClick={() => {
                navigate('/settings');
                onAfterNav?.();
              }}
            >
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-rose-500 focus:text-rose-500"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const brand = (collapsed) => (
    <div
      className={cn(
        'flex h-16 select-none items-center gap-2 border-b border-slate-800/60',
        collapsed ? 'justify-center px-0' : 'px-6'
      )}
    >
      <img
        src="/verixsoft-logo.png"
        alt="Verixsoft"
        className="h-7 w-7 shrink-0 select-none object-contain"
      />
      {!collapsed && (
        <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-lg font-bold tracking-tight text-transparent">
          Verixsoft CRM
        </span>
      )}
    </div>
  );

  // ── Desktop / tablet ──
  const desktopSidebar = (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          'z-30 hidden h-full shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-100 transition-[width] duration-200 ease-in-out dark:border-slate-800 md:flex',
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        {brand(isCollapsed)}
        {renderNav(isCollapsed, undefined)}

        <div className="sidebar-user-badge flex-col gap-2">
          {/* expand/collapse toggle (above the user card) */}
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            className={cn(
              'h-9 text-slate-400 hover:bg-slate-800/60 hover:text-slate-100',
              isCollapsed ? 'mx-auto w-9 justify-center px-0' : 'w-full justify-start gap-3 px-3'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-[18px] w-[18px] shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-[18px] w-[18px] shrink-0" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </Button>
          {renderUserMenu(isCollapsed)}
        </div>
      </aside>
    </TooltipProvider>
  );

  // ── Mobile overlay ──
  const mobileSidebar = (
    <>
      {isMobileOpen && (
        // Decorative dismiss overlay; keyboard users close via Escape or the close button.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeMobile} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-slate-900 text-slate-100 transition-transform duration-300 ease-in-out dark:border-slate-800 md:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800/60 px-6">
          <div className="flex items-center gap-2">
            <img
              src="/verixsoft-logo.png"
              alt="Verixsoft"
              className="h-7 w-7 shrink-0 select-none object-contain"
            />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-lg font-bold tracking-tight text-transparent">
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

        {renderNav(false, closeMobile)}

        <div className="sidebar-user-badge flex-col gap-2">{renderUserMenu(false, closeMobile)}</div>
      </aside>
    </>
  );

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
}
