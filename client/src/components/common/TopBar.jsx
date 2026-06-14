import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import useAuth from '../../hooks/useAuth.js';
import { clearCredentials } from '../../features/auth/authSlice.js';
import { useLogoutMutation } from '../../services/authApi.js';
import { Button } from '../ui/button.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.jsx';
import { Menu, User, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme.js';
import NotificationBell from '../../features/notifications/components/NotificationBell.jsx';

const pathTitleMap = {
  '/dashboard': 'Dashboard',
  '/tasks': 'My Tasks',
  '/clients': 'Clients',
  '/clients/new': 'New Client',
  '/leads': 'Leads',
  '/projects': 'Projects',
  '/projects/new': 'New Project',
  '/invoices': 'Invoices',
  '/invoices/new': 'New Invoice',
  '/employees': 'Employees',
  '/employees/new': 'New Employee',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/style-guide': 'Style Guide',
  '/activity': 'Activity Timeline',
  '/notifications': 'Notifications',
};

const getPageTitle = (pathname) => {
  if (pathTitleMap[pathname]) return pathTitleMap[pathname];

  if (pathname.startsWith('/clients/')) return 'Client Detail';
  if (pathname.startsWith('/leads/')) return 'Lead Detail';
  if (pathname.startsWith('/projects/')) return 'Project Detail';
  if (pathname.startsWith('/tasks/')) return 'Task Detail';
  if (pathname.startsWith('/invoices/')) return 'Invoice Detail';
  if (pathname.startsWith('/employees/')) return 'Employee Detail';

  return 'CRM System';
};

export default function TopBar({ openMobileSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Ignored
    }
    dispatch(clearCredentials());
    navigate('/login');
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className="h-16 w-full flex items-center justify-between px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-background z-20 shrink-0">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={openMobileSidebar}
          className="text-muted-foreground hover:text-foreground md:hidden"
          aria-label="Open Sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground tracking-tight select-none hidden sm:block">
          {title}
        </h1>
      </div>

      {/* Right section: Theme, Notifications, User Menu */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="User Menu">
                <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-800">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase font-semibold text-xs">
                    {user.name?.slice(0, 2) || 'US'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-foreground leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground leading-none truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center w-full cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center w-full cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-600 dark:focus:text-rose-400 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
