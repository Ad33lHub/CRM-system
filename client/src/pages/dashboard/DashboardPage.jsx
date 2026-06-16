import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectUserRole } from '@/features/auth/authSlice';
import AdminDashboard from '@/features/dashboard/components/AdminDashboard';
import ManagerDashboard from '@/features/dashboard/components/ManagerDashboard';
import EmployeeDashboard from '@/features/dashboard/components/EmployeeDashboard';

export default function DashboardPage() {
  const role = useSelector(selectUserRole);

  switch (role) {
    case 'super_admin':
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'developer':
    case 'designer':
    case 'qa_engineer':
      return <EmployeeDashboard />;
    case 'client':
      // Clients live in the dedicated premium portal.
      return <Navigate to="/portal" replace />;
    default:
      return <AdminDashboard />;
  }
}
