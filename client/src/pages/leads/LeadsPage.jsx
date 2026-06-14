import { PageHeader } from '../../components/ui/page-header.jsx';
import { EmptyState } from '../../components/ui/empty-state.jsx';
import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LeadsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads & Pipeline"
        subtitle="Manage business opportunities, prospective clients, and deal pipeline"
      />
      <EmptyState
        icon={TrendingUp}
        title="Pipeline is Empty"
        description="Add a new lead to start tracking opportunities and converting sales."
        action={{
          label: "Create New Lead",
          onClick: () => navigate('/leads/new'), // In-progress page mapping placeholder
        }}
      />
    </div>
  );
}
