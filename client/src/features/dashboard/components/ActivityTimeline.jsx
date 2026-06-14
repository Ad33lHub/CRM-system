import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Loader2,
} from 'lucide-react';
import { useGetActivityFeedQuery } from '@/services/analyticsApi';
import { cn } from '@/lib/utils';

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

const ENTITY_OPTIONS = ['All', 'Client', 'Project', 'Task', 'Invoice', 'Lead', 'User'];

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ActivityTimeline({ embedded = false }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [allActivities, setAllActivities] = useState([]);
  const [filters, setFilters] = useState({ entity: '', action: '', dateFrom: '', dateTo: '' });
  const [showFilters, setShowFilters] = useState(false);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 30,
      ...(filters.entity && { entity: filters.entity }),
      ...(filters.action && { action: filters.action }),
      ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters.dateTo && { dateTo: filters.dateTo }),
    }),
    [page, filters]
  );

  const { data, isLoading, isFetching } = useGetActivityFeedQuery(queryParams);

  const hasNextPage = data?.pagination?.hasNextPage || false;
  const total = data?.pagination?.totalItems || 0;

  useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        setAllActivities(data.data);
      } else {
        setAllActivities((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const newItems = data.data.filter((a) => !existingIds.has(a.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [data, page]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    setAllActivities([]);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ entity: '', action: '', dateFrom: '', dateTo: '' });
    setPage(1);
    setAllActivities([]);
  }, []);

  const hasActiveFilters = filters.entity || filters.action || filters.dateFrom || filters.dateTo;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetching) {
      setPage((p) => p + 1);
    }
  }, [hasNextPage, isFetching]);

  const content = (
    <>
      {/* Filter Panel */}
      {!embedded && (
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-primary ml-1" />
            )}
          </Button>

          {showFilters && (
            <div className="flex flex-wrap items-end gap-3 mt-3 p-4 border border-border rounded-lg bg-muted/20">
              <div className="space-y-1">
                <span className="block text-xs text-muted-foreground font-medium">Entity</span>
                <Select
                  value={filters.entity || 'All'}
                  onValueChange={(v) =>
                    handleFilterChange('entity', v === 'All' ? '' : v)
                  }
                >
                  <SelectTrigger className="w-[130px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_OPTIONS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label htmlFor="activity-date-from" className="text-xs text-muted-foreground font-medium">
                  From
                </label>
                <input
                  id="activity-date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="h-8 px-2 text-sm border border-input rounded-md bg-background"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="activity-date-to" className="text-xs text-muted-foreground font-medium">
                  To
                </label>
                <input
                  id="activity-date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="h-8 px-2 text-sm border border-input rounded-md bg-background"
                />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-8">
                  <X className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity List */}
      {isLoading && allActivities.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : allActivities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={hasActiveFilters ? 'No matching activity' : 'No activity found'}
          description={
            hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Activity will appear here as users interact with the CRM'
          }
          action={
            hasActiveFilters
              ? { label: 'Clear Filters', onClick: clearFilters }
              : undefined
          }
          className="min-h-[200px]"
        />
      ) : (
        <div
          className={cn('space-y-0.5', embedded && 'max-h-[420px] overflow-y-auto')}
        >
          {allActivities.map((item) => {
            const IconComp = ICON_MAP[item.icon] || Activity;
            const entityColor =
              ENTITY_COLORS[item.entity] ||
              'bg-slate-50 text-slate-700 border-slate-200';

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className="flex items-start gap-3 py-3 px-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => item.link && navigate(item.link)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && item.link) {
                    e.preventDefault();
                    navigate(item.link);
                  }
                }}
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  {item.performedBy?.avatar && (
                    <AvatarImage src={item.performedBy.avatar} />
                  )}
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {getInitials(item.performedBy?.name || 'SY')}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">
                    <span className="font-medium">{item.performedBy?.name}</span>{' '}
                    <span className="text-muted-foreground">
                      {item.description?.replace(item.performedBy?.name, '').trim()}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <IconComp className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] px-1.5 py-0 h-5 font-normal', entityColor)}
                    >
                      {item.entity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.timeAgo}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load More */}
          {hasNextPage && (
            <div className="flex justify-center pt-4 pb-2">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={isFetching}>
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <Card className="p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Latest actions across the CRM</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-primary"
            onClick={() => navigate('/activity')}
          >
            View all
          </Button>
        </div>
        {content}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Timeline"
        subtitle={total > 0 ? `${total} total activities` : 'All CRM activity'}
      />
      {content}
    </div>
  );
}
