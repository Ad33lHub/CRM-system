import { PageHeader } from '../../components/ui/page-header.jsx';
import { EmptyState } from '../../components/ui/empty-state.jsx';
import { TrendingUp } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function LeadDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Opportunity Detail"
        subtitle={`Viewing details for Lead ID: ${id}`}
        breadcrumbs={[
          { label: 'Leads', href: '/leads' },
          { label: 'Lead Detail' },
        ]}
      />
      <EmptyState
        icon={TrendingUp}
        title="Lead Information"
        description="View status stage, assignment info, email communication logs, and contact credentials."
        action={{
          label: "Back to Leads List",
          onClick: () => navigate('/leads'),
        }}
      />
    </div>
  );
}
