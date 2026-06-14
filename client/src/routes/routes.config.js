import { lazy } from 'react';
import { ROUTES } from '../constants/routes.js';

// Lazy load page components from correct nested directories
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

const StyleGuidePage = lazy(() => import('../pages/StyleGuidePage.jsx'));
const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage.jsx'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'));

export const ROUTE_CONFIG = [
  // Public
  { path: ROUTES.LOGIN, component: LoginPage, roles: null, layout: 'auth' },
  { path: ROUTES.REGISTER, component: RegisterPage, roles: null, layout: 'auth' },
  { path: ROUTES.FORGOT_PASSWORD, component: ForgotPasswordPage, roles: null, layout: 'auth' },
  { path: ROUTES.RESET_PASSWORD, component: ResetPasswordPage, roles: null, layout: 'auth' },

  // Protected: all authenticated roles
  { path: ROUTES.DASHBOARD, component: DashboardPage, roles: 'all', layout: 'app' },
  { path: ROUTES.PROFILE, component: ProfilePage, roles: 'all', layout: 'app' },
  { path: ROUTES.SETTINGS, component: SettingsPage, roles: 'all', layout: 'app' },
  { path: ROUTES.PROFILE_SETTINGS, component: ProfileSettingsPage, roles: 'all', layout: 'app' },
  { path: ROUTES.TASKS, component: TasksPage, roles: 'all', layout: 'app' },
  { path: ROUTES.TASK_DETAIL, component: TaskDetailPage, roles: 'all', layout: 'app' },
  { path: ROUTES.CHAT, component: ChatPage, roles: 'all', layout: 'app' },
  { path: ROUTES.MEETING_CREATE, component: MeetingProcessorPage, roles: 'all', layout: 'app' },
  { path: ROUTES.MEETING_DETAIL, component: MeetingDetailPage, roles: 'all', layout: 'app' },
  { path: ROUTES.PROJECTS, component: ProjectsPage, roles: 'all', layout: 'app' },
  { path: ROUTES.PROJECT_DETAIL, component: ProjectDetailPage, roles: 'all', layout: 'app' },

  // Protected: manager+
  { path: ROUTES.CLIENTS, component: ClientsPage, roles: ['super_admin', 'admin', 'manager'], layout: 'app' },
  { path: ROUTES.CLIENT_CREATE, component: ClientCreatePage, roles: ['super_admin', 'admin', 'manager'], layout: 'app' },
  { path: ROUTES.CLIENT_DETAIL, component: ClientProfilePage, roles: ['super_admin', 'admin', 'manager'], layout: 'app' },
  { path: ROUTES.LEADS, component: LeadsPage, roles: ['super_admin', 'admin', 'manager'], layout: 'app' },
  { path: ROUTES.LEAD_DETAIL, component: LeadDetailPage, roles: ['super_admin', 'admin', 'manager'], layout: 'app' },
  { path: ROUTES.PROJECT_CREATE, component: ProjectCreatePage, roles: ['super_admin', 'admin', 'manager'], layout: 'app' },
  { path: ROUTES.INVOICES, component: InvoicesPage, roles: ['super_admin', 'admin', 'manager'], layout: 'app' },
  { path: ROUTES.INVOICE_CREATE, component: InvoiceCreatePage, roles: ['super_admin', 'admin', 'manager'], layout: 'app' },
  { path: ROUTES.INVOICE_DETAIL, component: InvoiceDetailPage, roles: ['super_admin', 'admin', 'manager'], layout: 'app' },
  { path: ROUTES.TEAM, component: TeamDirectoryPage, roles: ['super_admin', 'admin', 'manager'], layout: 'app' },
  { path: ROUTES.ATTENDANCE, component: AttendanceReportPage, roles: ['super_admin', 'admin', 'manager'], layout: 'app' },
  { path: ROUTES.PROPOSAL_CREATE, component: ProposalGeneratorPage, roles: ['super_admin', 'admin', 'manager'], layout: 'app' },
  { path: ROUTES.REPORTS, component: ReportsPage, roles: ['super_admin', 'admin', 'manager'], layout: 'app' },

  // Protected: admin only
  { path: ROUTES.EMPLOYEES, component: EmployeesPage, roles: ['super_admin', 'admin'], layout: 'app' },
  { path: ROUTES.EMPLOYEE_CREATE, component: EmployeeCreatePage, roles: ['super_admin', 'admin'], layout: 'app' },
  { path: ROUTES.EMPLOYEE_DETAIL, component: EmployeeDetailPage, roles: ['super_admin', 'admin'], layout: 'app' },
  { path: ROUTES.EMAIL_WRITER, component: EmailWriterPage, roles: ['super_admin', 'admin'], layout: 'app' },
  { path: ROUTES.PRESENCE, component: PresencePage, roles: ['super_admin', 'admin'], layout: 'app' },

  // Protected: super admin only
  { path: ROUTES.ACTIVITY_DASHBOARD, component: ActivityDashboardPage, roles: ['super_admin'], layout: 'app' },

  // Dev only
  { path: ROUTES.STYLE_GUIDE, component: StyleGuidePage, roles: null, layout: 'bare', devOnly: true },

  // Errors
  { path: ROUTES.FORBIDDEN, component: ForbiddenPage, roles: null, layout: 'bare' },
  { path: ROUTES.NOT_FOUND, component: NotFoundPage, roles: null, layout: 'bare' },
];
