import * as React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const colorMaps = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
  red: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400',
  teal: 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400',
  pink: 'bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400',
  gray: 'bg-slate-50 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
};

function formatValue(value, prefix = '') {
  if (typeof value !== 'number') return `${prefix}${value}`;
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}K`;
  return `${prefix}${value.toLocaleString()}`;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = 'blue',
  prefix = '',
  loading = false,
  onClick,
  className,
}) {
  if (loading) {
    return (
      <Card className="p-6 space-y-4 shadow-sm border border-border">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24 bg-muted/80" />
          <Skeleton className="h-11 w-11 rounded-xl bg-muted/80" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-28 bg-muted/80" />
          <Skeleton className="h-4 w-32 bg-muted/80" />
        </div>
      </Card>
    );
  }

  const hasChange = typeof change === 'number';
  const isPositive = hasChange && change > 0;
  const isNegative = hasChange && change < 0;
  const colorClass = colorMaps[color] || colorMaps.blue;

  return (
    <Card
      className={cn(
        'p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-border bg-card text-card-foreground',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground tracking-tight">
          {title}
        </span>
        {Icon && (
          <div className={cn('p-2.5 rounded-xl shrink-0', colorClass)}>
            <Icon className="h-[22px] w-[22px]" />
          </div>
        )}
      </div>

      <div className="mt-4 space-y-1">
        <h3 className="text-2xl font-semibold tracking-tight">
          {formatValue(value, prefix)}
        </h3>
        {hasChange ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium rounded-full px-1.5 py-0.5',
                isPositive &&
                  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
                isNegative &&
                  'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
                !isPositive &&
                  !isNegative &&
                  'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
              )}
            >
              {isPositive && <ArrowUpRight className="h-3 w-3" />}
              {isNegative && <ArrowDownRight className="h-3 w-3" />}
              {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
              {isPositive ? '+' : ''}
              {change === 0 ? 'No change' : `${change}%`}
            </span>
            {changeLabel && (
              <span className="text-muted-foreground">{changeLabel}</span>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
