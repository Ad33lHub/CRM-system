import { PageHeader } from '../../components/ui/page-header.jsx';
import { EmptyState } from '../../components/ui/empty-state.jsx';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sign Up"
        subtitle="Create an account to start managing leads and projects"
      />
      <EmptyState
        icon={UserPlus}
        title="Registration Page"
        description="Register a new employee profile. If you already have an account, click below to sign in."
        action={{
          label: "Back to Login",
          onClick: () => navigate('/login'),
        }}
      />
    </div>
  );
}
