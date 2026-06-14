import { createBrowserRouter, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import AppLayout from '../components/layout/AppLayout.jsx';

// Loader component (PageLoader)
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Lazy load pages from correct nested directories
const LoginPage = lazy(() => import('../pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage.jsx'));

const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage.jsx'));
const ProfilePage = lazy(() => import('../pages/ProfilePage.jsx'));
const SettingsPage = lazy(() => import('../pages/SettingsPage.jsx'));
const TasksPage = lazy(() => import('../pages/tasks/TasksPage.jsx'));
const TaskDetailPage = lazy(() => import('../pages/tasks/TaskDetailPage.jsx'));

const ClientsPage = lazy(() => import('../pages/clients/ClientsPage.jsx'));
const ClientCreatePage = lazy(() => import('../pages/clients/ClientCreatePage.jsx'));
const ClientProfilePage = lazy(() => import('../pages/clients/ClientProfilePage.jsx'));

const LeadsPage = lazy(() => import('../pages/leads/LeadsPage.jsx'));
const LeadDetailPage = lazy(() => import('../pages/leads/LeadDetailPage.jsx'));

const ProjectsPage = lazy(() => import('../pages/projects/ProjectsPage.jsx'));
const ProjectCreatePage = lazy(() => import('../pages/projects/ProjectCreatePage.jsx'));
const ProjectDetailPage = lazy(() => import('../pages/projects/ProjectDetailPage.jsx'));

const InvoicesPage = lazy(() => import('../pages/invoices/InvoicesPage.jsx'));
const InvoiceCreatePage = lazy(() => import('../pages/invoices/InvoiceCreatePage.jsx'));
const InvoiceDetailPage = lazy(() => import('../pages/invoices/InvoiceDetailPage.jsx'));

const EmployeesPage = lazy(() => import('../pages/employees/EmployeesPage.jsx'));
const EmployeeCreatePage = lazy(() => import('../pages/employees/EmployeeCreatePage.jsx'));
const EmployeeDetailPage = lazy(() => import('../pages/employees/EmployeeDetailPage.jsx'));

const ActivityTimelinePage = lazy(() => import('../pages/ActivityTimelinePage.jsx'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage.jsx'));

// New integration pages
const TeamDirectoryPage = lazy(() => import('../pages/TeamDirectoryPage.jsx'));
const AttendanceReportPage = lazy(() => import('../pages/AttendanceReportPage.jsx'));
const ChatPage = lazy(() => import('../pages/chat/ChatPage.jsx'));
const MeetingProcessorPage = lazy(() => import('../pages/meetings/MeetingProcessorPage.jsx'));
const MeetingDetailPage = lazy(() => import('../pages/meetings/MeetingDetailPage.jsx'));
const ProposalGeneratorPage = lazy(() => import('../pages/proposals/ProposalGeneratorPage.jsx'));
const EmailWriterPage = lazy(() => import('../pages/tools/EmailWriterPage.jsx'));
const ReportsPage = lazy(() => import('../pages/ReportsPage.jsx'));
const ProfileSettingsPage = lazy(() => import('../pages/settings/ProfileSettingsPage.jsx'));
const PresencePage = lazy(() => import('../pages/admin/PresencePage.jsx'));
const ActivityDashboardPage = lazy(() => import('../pages/admin/ActivityDashboardPage.jsx'));

const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage.jsx'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'));
const StyleGuidePage = lazy(() => import('../pages/StyleGuidePage.jsx'));

const lazyLoad = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  // Auth Layout (public)
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: lazyLoad(LoginPage) },
      { path: '/register', element: lazyLoad(RegisterPage) },
      { path: '/forgot-password', element: lazyLoad(ForgotPasswordPage) },
      { path: '/reset-password', element: lazyLoad(ResetPasswordPage) },
    ],
  },
  // Protected Route for all authenticated roles
  {
    element: <ProtectedRoute requiredRoles={['all']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: lazyLoad(DashboardPage) },
          { path: '/profile', element: lazyLoad(ProfilePage) },
          { path: '/settings', element: lazyLoad(SettingsPage) },
          { path: '/settings/profile', element: lazyLoad(ProfileSettingsPage) },
          { path: '/tasks', element: lazyLoad(TasksPage) },
          { path: '/tasks/:id', element: lazyLoad(TaskDetailPage) },
          { path: '/notifications', element: lazyLoad(NotificationsPage) },
          { path: '/chat', element: lazyLoad(ChatPage) },
          { path: '/meetings/new', element: lazyLoad(MeetingProcessorPage) },
          { path: '/meetings/:id', element: lazyLoad(MeetingDetailPage) },
          { path: '/projects', element: lazyLoad(ProjectsPage) },
          { path: '/projects/:id', element: lazyLoad(ProjectDetailPage) },
        ],
      },
    ],
  },
  // Protected Route for manager+
  {
    element: <ProtectedRoute requiredRoles={['super_admin', 'admin', 'manager']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/clients', element: lazyLoad(ClientsPage) },
          { path: '/clients/new', element: lazyLoad(ClientCreatePage) },
          { path: '/clients/:id', element: lazyLoad(ClientProfilePage) },
          { path: '/leads', element: lazyLoad(LeadsPage) },
          { path: '/leads/:id', element: lazyLoad(LeadDetailPage) },
          { path: '/projects/new', element: lazyLoad(ProjectCreatePage) },
          { path: '/invoices', element: lazyLoad(InvoicesPage) },
          { path: '/invoices/new', element: lazyLoad(InvoiceCreatePage) },
          { path: '/invoices/:id', element: lazyLoad(InvoiceDetailPage) },
          { path: '/activity', element: lazyLoad(ActivityTimelinePage) },
          { path: '/team', element: lazyLoad(TeamDirectoryPage) },
          { path: '/attendance', element: lazyLoad(AttendanceReportPage) },
          { path: '/proposals', element: lazyLoad(ProposalGeneratorPage) },
          { path: '/proposals/new', element: lazyLoad(ProposalGeneratorPage) },
          { path: '/reports', element: lazyLoad(ReportsPage) },
        ],
      },
    ],
  },
  // Protected Route for admin+
  {
    element: <ProtectedRoute requiredRoles={['super_admin', 'admin']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/employees', element: lazyLoad(EmployeesPage) },
          { path: '/employees/new', element: lazyLoad(EmployeeCreatePage) },
          { path: '/employees/:id', element: lazyLoad(EmployeeDetailPage) },
          { path: '/tools/email-writer', element: lazyLoad(EmailWriterPage) },
          { path: '/admin/presence', element: lazyLoad(PresencePage) },
        ],
      },
    ],
  },
  // Protected Route for super_admin only
  {
    element: <ProtectedRoute requiredRoles={['super_admin']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/admin/activity', element: lazyLoad(ActivityDashboardPage) },
        ],
      },
    ],
  },
  // Error & bare routes
  { path: '/403', element: lazyLoad(ForbiddenPage) },
  { path: '/404', element: lazyLoad(NotFoundPage) },
  ...(import.meta.env.DEV ? [{ path: '/style-guide', element: lazyLoad(StyleGuidePage) }] : []),
  { path: '*', element: <Navigate to="/404" replace /> },
]);

export default router;
