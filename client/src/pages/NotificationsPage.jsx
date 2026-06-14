import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import useNotifications from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
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
  task: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400',
  project: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
  invoice: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  lead: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  system: 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  payment: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  leave: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400',
  chat: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  employee: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
  deadline: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  reminder: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
  performance: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400',
  mention: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
};

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-400',
  low: 'bg-slate-300',
};

const TYPE_TABS = [
  'all', 'task', 'project', 'invoice', 'payment', 'lead',
  'reminder', 'deadline', 'leave', 'employee', 'system',
];

function dateGroup(date) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This Week';
  return 'Older';
}

function relativeTime(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function groupByDate(notifications) {
  const groups = {};
  const order = ['Today', 'Yesterday', 'This Week', 'Older'];
  notifications.forEach((n) => {
    const g = dateGroup(n.createdAt);
    if (!groups[g]) groups[g] = [];
    groups[g].push(n);
  });
  return order.filter((g) => groups[g]).map((g) => ({ label: g, items: groups[g] }));
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, clearAll, deleteOne } =
    useNotifications();

  const filtered =
    activeTab === 'all' ? notifications : notifications.filter((n) => n.type === activeTab);

  const grouped = groupByDate(filtered);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-1" /> Clear read
            </Button>
          </div>
        }
      />

      {/* Type filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-4 border border-border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description={
            activeTab === 'all'
              ? "You're all caught up! Notifications will appear here."
              : `No ${activeTab} notifications.`
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ label, items }) => (
            <div key={label}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {label}
              </h3>
              <div className="space-y-2">
                {items.map((n) => {
                  const TypeIcon = ICON_MAP[n.type] || Activity;
                  const typeColor = TYPE_COLORS[n.type] || TYPE_COLORS.system;
                  const priorityDot = PRIORITY_DOT[n.priority] || PRIORITY_DOT.normal;

                  return (
                    <div
                      key={n.id || n._id}
                      className={cn(
                        'flex items-start gap-4 p-4 border rounded-lg transition-colors',
                        n.priority === 'urgent'
                          ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                          : !n.isRead
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                            : 'border-border hover:bg-muted/30'
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <div
                          className={cn(
                            'h-10 w-10 rounded-full flex items-center justify-center',
                            typeColor
                          )}
                        >
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        {!n.isRead && (
                          <span
                            className={cn(
                              'absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background',
                              priorityDot
                            )}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p
                            className={cn(
                              'text-sm flex-1',
                              !n.isRead ? 'font-semibold text-foreground' : 'text-foreground'
                            )}
                          >
                            {n.title}
                            {n.batchCount > 1 && (
                              <span className="ml-1.5 text-xs font-normal bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                                ×{n.batchCount}
                              </span>
                            )}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={cn('text-xs', typeColor)}>
                            {n.type}
                          </Badge>
                          {n.priority && n.priority !== 'normal' && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                n.priority === 'urgent'
                                  ? 'border-red-300 text-red-600'
                                  : 'border-orange-300 text-orange-600'
                              )}
                            >
                              {n.priority}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {relativeTime(n.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!n.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markAsRead(n.id || n._id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                          onClick={() => deleteOne(n.id || n._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
