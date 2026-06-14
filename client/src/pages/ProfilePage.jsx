import { PageHeader } from '../components/ui/page-header.jsx';
import { EmptyState } from '../components/ui/empty-state.jsx';
import { User } from 'lucide-react';
import useAuth from '../hooks/useAuth.js';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information, profile photo, and security password"
      />
      <EmptyState
        icon={User}
        title={`Hello, ${user?.name || 'User'}`}
        description={`Manage your credentials for: ${user?.email || 'your account'}.`}
      />
    </div>
  );
}
