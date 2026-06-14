import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FolderKanban, Receipt } from 'lucide-react';

export default function ClientPortalDashboard() {
  const user = useSelector(selectCurrentUser);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Portal"
        subtitle={`Welcome, ${user?.firstName || 'Client'}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-6 shadow-sm border border-border">
          <h3 className="text-base font-semibold text-foreground mb-4">Your Projects</h3>
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Your active projects will appear here with status, deadline, and progress"
            className="min-h-[260px]"
          />
        </Card>

        <Card className="p-6 shadow-sm border border-border">
          <h3 className="text-base font-semibold text-foreground mb-4">Your Invoices</h3>
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            description="Your invoices with due amounts and payment status will appear here"
            className="min-h-[260px]"
          />
        </Card>
      </div>
    </div>
  );
}
