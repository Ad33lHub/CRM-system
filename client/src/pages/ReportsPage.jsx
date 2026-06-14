import React from 'react';
import { PageHeader } from '../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { StatCard } from '../components/ui/stat-card.jsx';
import { useGetReportsQuery } from '../services/reportsApi.js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Wallet, Briefcase, Users, 
  Activity, AlertTriangle, ShieldCheck 
} from 'lucide-react';

export default function ReportsPage() {
  const { data: reportData, isLoading } = useGetReportsQuery();
  const reports = reportData?.data;

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400">Loading reports summary analytics...</div>;
  }

  if (!reports) {
    return <div className="text-center py-12 text-slate-400">No reports data available.</div>;
  }

  // 1. Prepare Leads Funnel Chart data
  const leadData = Object.entries(reports.leads || {}).map(([stage, count]) => ({
    name: stage.charAt(0).toUpperCase() + stage.slice(1),
    count
  }));

  // 2. Prepare Task Status Pie Chart data
  const taskData = Object.entries(reports.tasks || {}).map(([status, count]) => ({
    name: status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1),
    value: count
  })).filter(t => t.value > 0);

  const TASK_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'];

  // 3. Project Health statistics
  const healthStats = reports.projects?.health || { green: 0, amber: 0, red: 0 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics Dashboard"
        subtitle="Examine sales conversion funnels, client invoices revenue, and overall project health"
      />

      {/* Top executive stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Confirmed Revenue"
          value={`$${(reports.financials?.totalRevenue || 0).toLocaleString()}`}
          icon={TrendingUp}
          trend={{ value: 12.5, isPositive: true, label: "from last month" }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
        />
        <StatCard
          title="Pending Receivables"
          value={`$${(reports.financials?.pendingAmount || 0).toLocaleString()}`}
          icon={Wallet}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
        />
        <StatCard
          title="Active Projects Workspace"
          value={reports.projects?.totalCount || 0}
          icon={Briefcase}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
        />
        <StatCard
          title="On-boarded Staff Count"
          value={reports.employeesCount || 0}
          icon={Users}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Leads conversion Funnel */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span>Sales & Leads Funnel Stage</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff', fontSize: 11 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Allocations */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span>Task Status Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            {taskData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {taskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TASK_COLORS[index % TASK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff', fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs">No active tasks recorded.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RAG Project Health + Invoice Status summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* RAG Health summary */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Project RAG Health Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Green */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>On Track (Green)</span>
                </span>
                <span>{healthStats.green}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(healthStats.green / (reports.projects?.totalCount || 1)) * 100}%` }} />
              </div>
            </div>

            {/* Amber */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span>At Risk (Amber)</span>
                </span>
                <span>{healthStats.amber}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${(healthStats.amber / (reports.projects?.totalCount || 1)) * 100}%` }} />
              </div>
            </div>

            {/* Red */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Overdue / Blocked (Red)</span>
                </span>
                <span>{healthStats.red}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${(healthStats.red / (reports.projects?.totalCount || 1)) * 100}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice status counts summary */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
              Billing & Invoices Registry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span>Paid Invoices</span>
                <span className="text-emerald-500 font-bold">{reports.financials?.invoiceStatuses?.paid || 0}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span>Sent / Pending</span>
                <span className="text-blue-500 font-bold">{reports.financials?.invoiceStatuses?.sent || 0}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span>Overdue Invoices</span>
                <span className="text-rose-500 font-bold">{reports.financials?.invoiceStatuses?.overdue || 0}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span>Draft Bills</span>
                <span className="text-slate-400 font-bold">{reports.financials?.invoiceStatuses?.draft || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
