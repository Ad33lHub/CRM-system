import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ListChecks } from 'lucide-react';
import { useGetTaskStatusChartQuery } from '@/services/analyticsApi';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

function CenterLabel({ viewBox, total }) {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        className="fill-foreground text-2xl font-semibold"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        className="fill-muted-foreground text-xs"
      >
        Total Tasks
      </text>
    </g>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground">{d.label}</p>
      <p className="text-muted-foreground">
        {d.count} tasks
      </p>
    </div>
  );
}

export default function TaskStatusChart() {
  const { data, isLoading, isFetching } = useGetTaskStatusChartQuery();

  const loading = isLoading || isFetching;
  const taskStatusData = data?.data?.taskStatusData || [];
  const total = data?.data?.total || 0;
  const isEmpty = taskStatusData.every((d) => d.count === 0);

  return (
    <Card className="p-6 shadow-sm border border-border">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-foreground">Task Overview</h3>
        {!loading && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} total tasks across all projects
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[280px]">
          <Skeleton className="h-[200px] w-[200px] rounded-full" />
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks yet"
          description="Create tasks to see status distribution"
          className="min-h-[280px]"
        />
      ) : (
        <div className="flex items-center gap-6 flex-col sm:flex-row">
          <div className="flex-shrink-0">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  startAngle={90}
                  endAngle={-270}
                >
                  {taskStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                  <CenterLabel viewBox={{ cx: 110, cy: 110 }} total={total} />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2.5 min-w-0">
            {taskStatusData.map((entry) => (
              <div key={entry.status} className="flex items-center gap-2.5 text-sm">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground flex-1">{entry.label}</span>
                <span className="font-medium text-foreground tabular-nums">
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
