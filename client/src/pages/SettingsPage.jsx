import { PageHeader } from '../components/ui/page-header.jsx';
import { EmptyState } from '../components/ui/empty-state.jsx';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage CRM configuration parameters and global system rules"
      />
      <EmptyState
        icon={Settings}
        title="System Configurations"
        description="Configure SMTP mail server, automated backup jobs, notification channels, or currency definitions."
      />
    </div>
  );
}
