import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { PageHeader } from '@/components/ui/page-header';
import PeriodSelector from './PeriodSelector';
import StatsGrid from './StatsGrid';
import RevenueBarChart from './RevenueBarChart';
import LeadFunnelChart from './LeadFunnelChart';
import TaskStatusChart from './TaskStatusChart';
import ActivityTimeline from './ActivityTimeline';

export default function AdminDashboard() {
  const [period, setPeriod] = useState('30d');
  const user = useSelector(selectCurrentUser);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.firstName || 'Admin'}`}
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />

      <StatsGrid period={period} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <RevenueBarChart period={period} />
        </div>
        <div className="lg:col-span-2">
          <LeadFunnelChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TaskStatusChart />
        <ActivityTimeline embedded={true} />
      </div>
    </div>
  );
}
