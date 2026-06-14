import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3 } from 'lucide-react';
import { useGetRevenueChartQuery } from '@/services/analyticsApi';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function formatAxis(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}:{' '}
          <span className="font-medium">
            {entry.name.includes('Revenue')
              ? `PKR ${entry.value?.toLocaleString()}`
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function RevenueBarChart({ period = '12m' }) {
  const chartPeriod = period === '7d' || period === '30d' ? '6m' : '12m';
  const { data, isLoading, isFetching } = useGetRevenueChartQuery(chartPeriod);

  const chartData = data?.data || [];
  const loading = isLoading || isFetching;
  const totalRevenue = chartData.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const isEmpty = chartData.every((d) => d.revenue === 0);

  return (
    <Card className="p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Revenue Overview</h3>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Total: PKR {totalRevenue.toLocaleString()}
            </p>
          )}
        </div>
        <span className="text-xs font-medium bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
          {chartPeriod === '6m' ? '6 months' : '12 months'}
        </span>
      </div>

      {loading ? (
        <Skeleton className="h-[320px] w-full rounded-xl" />
      ) : isEmpty ? (
        <EmptyState
          icon={BarChart3}
          title="No revenue data"
          description="No paid invoices found for this period"
          className="min-h-[320px]"
        />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatAxis}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="Revenue (PKR)"
              maxBarSize={48}
            />
            <Line
              yAxisId="right"
              dataKey="invoiceCount"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 3, fill: '#8b5cf6' }}
              name="Invoices"
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
