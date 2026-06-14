import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Activity,
  FolderPlus,
  Receipt,
  Target,
  ListPlus,
  UserPlus,
  X,
  CreditCard,
  Calendar,
  MessageSquare,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  task: ListPlus,
  project: FolderPlus,
  invoice: Receipt,
  lead: Target,
  system: Activity,
  mention: MessageSquare,
  reminder: Clock,
  payment: CreditCard,
  leave: Calendar,
  chat: MessageSquare,
  employee: UserPlus,
  deadline: AlertTriangle,
  performance: TrendingUp,
};

const TYPE_COLORS = {
  task: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400',
  project: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400',
  invoice: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400',
  lead: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400',
  system: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400',
  mention: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400',
  reminder: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400',
  payment: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400',
  leave: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400',
  chat: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400',
  employee: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400',
  deadline: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400',
  performance: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400',
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'task', label: 'Tasks' },
  { key: 'payment', label: 'Payments' },
  { key: 'deadline', label: 'Deadlines' },
];

function relativeTime(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteOne,
    toggle,
    isOpen,
  } = useNotifications();

  const panelRef = useRef(null);
  const bellRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [pulse, setPulse] = useState(false);
  const prevCount = useRef(unreadCount);

  // Pulse animation on new notification
  useEffect(() => {
    if (unreadCount > prevCount.current) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(timer);
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        bellRef.current &&
        !bellRef.current.contains(e.target)
      ) {
        toggle();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, toggle]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) toggle();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, toggle]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.isRead;
    return n.type === activeFilter;
  });

  const handleItemClick = useCallback(
    (notification) => {
      if (!notification.isRead) {
        markAsRead(notification.id || notification._id);
      }
      if (notification.link) {
        navigate(notification.link);
      }
      toggle();
    },
    [markAsRead, navigate, toggle]
  );

  const readCount = notifications.filter((n) => n.isRead).length;

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        ref={bellRef}
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="text-muted-foreground hover:text-foreground relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <>
            {pulse && (
              <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-rose-500 animate-ping opacity-75" />
            )}
            <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute top-full right-0 mt-2 w-[380px] max-w-[calc(100vw-16px)] max-h-[520px] bg-popover border border-border rounded-xl shadow-xl z-60 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggle}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-blue-600 hover:text-blue-700 dark:text-blue-400 px-2"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-muted-foreground hover:text-rose-600 px-2"
                onClick={clearAll}
                disabled={readCount === 0}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Clear read
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 border-b border-border flex gap-1 overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                  activeFilter === tab.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-foreground">
                  {activeFilter === 'unread'
                    ? 'No unread notifications'
                    : "You're all caught up!"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeFilter !== 'all' && (
                    <button
                      onClick={() => setActiveFilter('all')}
                      className="text-primary hover:underline"
                    >
                      View all notifications
                    </button>
                  )}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((n) => {
                  const TypeIcon = ICON_MAP[n.type] || Activity;
                  const typeColor = TYPE_COLORS[n.type] || TYPE_COLORS.system;

                  return (
                    // Notification row; activates on click or keyboard.
                    <div
                      key={n.id || n._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleItemClick(n)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleItemClick(n);
                        }
                      }}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40',
                        !n.isRead && 'bg-blue-50/50 dark:bg-blue-950/20 border-l-[3px] border-l-blue-500',
                        n.isRead && 'border-l-[3px] border-l-transparent'
                      )}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center',
                          typeColor
                        )}
                      >
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm leading-snug',
                            !n.isRead ? 'font-semibold text-foreground' : 'text-foreground'
                          )}
                        >
                          {n.title}
                          {n.batchCount > 1 && (
                            <span className="ml-1.5 text-[10px] font-normal bg-muted text-muted-foreground px-1 py-0.5 rounded-full">
                              ×{n.batchCount}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 py-0 h-4 font-normal', typeColor)}
                          >
                            {n.type}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {relativeTime(n.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {!n.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id || n._id);
                            }}
                            className="text-muted-foreground hover:text-blue-600 p-0.5"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteOne(n.id || n._id);
                          }}
                          className="text-muted-foreground hover:text-rose-600 p-0.5"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="px-4 py-2.5 border-t border-border text-center">
              <button
                onClick={() => {
                  navigate('/notifications');
                  toggle();
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
