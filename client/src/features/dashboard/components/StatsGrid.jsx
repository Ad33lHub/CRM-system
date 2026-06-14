import { StatCard } from '@/components/ui/stat-card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  FolderKanban,
  CheckSquare,
  Building2,
  AlertCircle,
  Target,
  RefreshCw,
} from 'lucide-react';
import { useGetDashboardStatsQuery } from '@/services/analyticsApi';

const PERIOD_LABELS = {
  '7d': 'vs previous 7 days',
  '30d': 'vs previous 30 days',
  '90d': 'vs previous 90 days',
  '12m': 'vs previous 12 months',
};

export default function StatsGrid({ period = '30d' }) {
  const { data, isLoading, isFetching, error, refetch } = useGetDashboardStatsQuery(period);

  if (error) {
    return (
      <Alert variant="destructive" className="flex items-center justify-between">
        <div>
          <AlertTitle>Failed to load statistics</AlertTitle>
          <AlertDescription>
            {error?.data?.message || 'Something went wrong. Please try again.'}
          </AlertDescription>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-1" /> Retry
        </Button>
      </Alert>
    );
  }

  const loading = isLoading || isFetching;
  const stats = data?.data?.stats;
  const changeLabel = PERIOD_LABELS[period] || `vs previous ${period}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <StatCard
        title="Total Revenue"
        value={loading ? 0 : stats?.revenue?.current || 0}
        change={loading ? null : stats?.revenue?.change}
        changeLabel={changeLabel}
        icon={TrendingUp}
        color="green"
        prefix="PKR "
        loading={loading}
      />
      <StatCard
        title="Active Projects"
        value={loading ? 0 : stats?.activeProjects?.current || 0}
        change={loading ? null : stats?.activeProjects?.change}
        changeLabel={changeLabel}
        icon={FolderKanban}
        color="blue"
        loading={loading}
      />
      <StatCard
        title="Open Leads"
        value={loading ? 0 : stats?.openLeads?.current || 0}
        change={loading ? null : stats?.openLeads?.change}
        changeLabel={changeLabel}
        icon={Target}
        color="purple"
        loading={loading}
      />
      <StatCard
        title="Open Tasks"
        value={loading ? 0 : stats?.openTasks?.current || 0}
        change={loading ? null : stats?.openTasks?.change}
        changeLabel={changeLabel}
        icon={CheckSquare}
        color="amber"
        loading={loading}
      />
      <StatCard
        title="Total Clients"
        value={loading ? 0 : stats?.totalClients?.current || 0}
        change={loading ? null : stats?.totalClients?.change}
        changeLabel={changeLabel}
        icon={Building2}
        color="teal"
        loading={loading}
      />
      <StatCard
        title="Overdue Invoices"
        value={loading ? 0 : stats?.overdueInvoices?.current || 0}
        change={null}
        icon={AlertCircle}
        color={stats?.overdueInvoices?.current > 0 ? 'red' : 'gray'}
        loading={loading}
      />
    </div>
  );
}
