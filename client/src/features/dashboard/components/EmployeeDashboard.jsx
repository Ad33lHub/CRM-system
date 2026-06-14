import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckSquare, CalendarClock, CheckCircle, ListChecks } from 'lucide-react';
import TaskStatusChart from './TaskStatusChart';

export default function EmployeeDashboard() {
  const user = useSelector(selectCurrentUser);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Workspace"
        subtitle={`Welcome back, ${user?.firstName || 'Team Member'}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="My Open Tasks"
          value={0}
          icon={CheckSquare}
          color="blue"
        />
        <StatCard
          title="Tasks Due Today"
          value={0}
          icon={CalendarClock}
          color="amber"
        />
        <StatCard
          title="Completed This Week"
          value={0}
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TaskStatusChart />
        <Card className="p-6 shadow-sm border border-border">
          <h3 className="text-base font-semibold text-foreground mb-4">My Projects</h3>
          <EmptyState
            icon={ListChecks}
            title="No assigned projects"
            description="Projects you're part of will appear here"
            className="min-h-[240px]"
          />
        </Card>
      </div>
    </div>
  );
}
