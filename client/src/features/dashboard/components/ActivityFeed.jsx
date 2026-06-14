import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  UserPlus,
  LogIn,
  Key,
  ShieldCheck,
  Receipt,
  FilePlus,
  FolderPlus,
  CheckCircle,
  ListPlus,
  Trophy,
  Target,
  Building2,
} from 'lucide-react';
import { useGetActivityFeedQuery } from '@/services/analyticsApi';

const ICON_MAP = {
  'user-plus': UserPlus,
  'log-in': LogIn,
  key: Key,
  'shield-check': ShieldCheck,
  receipt: Receipt,
  'file-plus': FilePlus,
  'folder-plus': FolderPlus,
  'check-circle': CheckCircle,
  'list-plus': ListPlus,
  trophy: Trophy,
  target: Target,
  'building-2': Building2,
  activity: Activity,
};

const ENTITY_COLORS = {
  User: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400',
  Project: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400',
  Invoice: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400',
  Lead: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400',
  Task: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400',
  Client: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400',
};

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ActivityFeed() {
  const { data, isLoading, isFetching } = useGetActivityFeedQuery(20, {
    pollingInterval: 60000,
  });

  const [, setTick] = useState(0);

  // Re-render every 60s to update relative times
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const loading = isLoading || isFetching;
  const activities = data?.data || [];

  return (
    <Card className="p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Latest actions across the CRM</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No recent activity"
          description="Activity will appear here as users interact with the CRM"
          className="min-h-[200px]"
        />
      ) : (
        <div className="space-y-1">
          {activities.map((item) => {
            const IconComp = ICON_MAP[item.icon] || Activity;
            const entityColor =
              ENTITY_COLORS[item.entity] ||
              'bg-slate-50 text-slate-700 border-slate-200';

            return (
              <div
                key={item.id}
                className="flex items-start gap-3 py-3 px-2 rounded-lg hover:bg-muted/40 transition-colors"
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  {item.performedBy.avatar && (
                    <AvatarImage src={item.performedBy.avatar} />
                  )}
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {getInitials(item.performedBy.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">
                    <span className="font-medium">{item.performedBy.name}</span>{' '}
                    <span className="text-muted-foreground">
                      {item.description.replace(item.performedBy.name, '').trim()}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <IconComp className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-5 font-normal ${entityColor}`}
                    >
                      {item.entity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.timeAgo}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
