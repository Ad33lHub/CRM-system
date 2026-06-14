import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { useGetLeadFunnelQuery } from '@/services/analyticsApi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground">{d.stage}</p>
      <p className="text-muted-foreground">
        Count: <span className="font-medium text-foreground">{d.count}</span>
      </p>
    </div>
  );
}

export default function LeadFunnelChart() {
  const { data, isLoading, isFetching } = useGetLeadFunnelQuery();

  const loading = isLoading || isFetching;
  const funnelData = data?.data?.funnelData || [];
  const wonRate = data?.data?.wonRate || 0;
  const total = data?.data?.total || 0;
  const isEmpty = funnelData.every((d) => d.count === 0);

  const lostCount = funnelData.find((d) => d.value === 'lost')?.count || 0;
  const lostRate = total > 0 ? Math.round((lostCount / total) * 100) / 10 : 0;
  const inPipeline = funnelData
    .filter((d) => !['won', 'lost'].includes(d.value))
    .reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="p-6 shadow-sm border border-border">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-foreground">Lead Pipeline</h3>
        {!loading && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Total: {total} leads
          </p>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-[320px] w-full rounded-xl" />
      ) : isEmpty ? (
        <EmptyState
          icon={Target}
          title="No leads yet"
          description="Start adding leads to see pipeline data"
          className="min-h-[320px]"
        />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={funnelData}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="stage"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {funnelData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
            >
              Win Rate: {wonRate}%
            </Badge>
            <Badge
              variant="outline"
              className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800"
            >
              Lost: {lostRate}%
            </Badge>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
            >
              Pipeline: {inPipeline}
            </Badge>
          </div>
        </>
      )}
    </Card>
  );
}
