import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { useGetDashboardStatsQuery } from '@/services/analyticsApi';
import {
  FolderKanban,
  Target,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import PeriodSelector from './PeriodSelector';
import RevenueBarChart from './RevenueBarChart';
import LeadFunnelChart from './LeadFunnelChart';
import ActivityFeed from './ActivityFeed';

const PERIOD_LABELS = {
  '7d': 'vs previous 7 days',
  '30d': 'vs previous 30 days',
  '90d': 'vs previous 90 days',
  '12m': 'vs previous 12 months',
};

export default function ManagerDashboard() {
  const [period, setPeriod] = useState('30d');
  const user = useSelector(selectCurrentUser);
  const { data, isLoading, isFetching } = useGetDashboardStatsQuery(period);

  const loading = isLoading || isFetching;
  const stats = data?.data?.stats;
  const changeLabel = PERIOD_LABELS[period] || `vs previous ${period}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.firstName || 'Manager'}`}
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
          title="Overdue Invoices"
          value={loading ? 0 : stats?.overdueInvoices?.current || 0}
          change={null}
          icon={AlertCircle}
          color={stats?.overdueInvoices?.current > 0 ? 'red' : 'gray'}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RevenueBarChart period={period} />
        <LeadFunnelChart />
      </div>

      <ActivityFeed />
    </div>
  );
}
