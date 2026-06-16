import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import {
  useGetPortalProjectsQuery,
  useGetPortalInvoicesQuery,
  useGetPortalThreadsQuery,
} from '../../services/portalApi.js';
import { FolderKanban, Receipt, MessagesSquare, ArrowRight } from 'lucide-react';

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300',
  on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

const money = (n, c = 'PKR') => `${c} ${Number(n || 0).toLocaleString()}`;

function projectProgress(p) {
  const ms = p.milestones || [];
  if (!ms.length) return p.status === 'completed' ? 100 : 0;
  return Math.round(ms.reduce((s, m) => s + (m.completionPercent || 0), 0) / ms.length);
}

function StatCard({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

export default function PortalDashboardPage() {
  const user = useSelector(selectCurrentUser);
  const { data: projData } = useGetPortalProjectsQuery();
  const { data: invData } = useGetPortalInvoicesQuery();
  const { data: threadData } = useGetPortalThreadsQuery();

  const projects = projData?.data || [];
  const invoices = invData?.data || [];
  const threads = threadData?.data || [];

  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const outstanding = invoices
    .filter((i) => !['paid', 'void'].includes(i.status))
    .reduce((s, i) => s + Math.max(0, (i.total || 0) - (i.paidAmount || 0)), 0);
  const unread = threads.reduce((s, t) => s + (t.unread || 0), 0);
  const currency = invoices[0]?.currency || 'PKR';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
          Welcome back, {user?.firstName || 'there'}
        </h1>
        <p className="text-sm text-slate-400">
          An overview of your projects, invoices, and conversations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={FolderKanban}
          label="Active projects"
          value={activeProjects}
          sub={`${projects.length} total`}
          tone="bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
        />
        <StatCard
          icon={Receipt}
          label="Outstanding balance"
          value={money(outstanding, currency)}
          sub={`${invoices.length} invoice(s)`}
          tone="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
        />
        <StatCard
          icon={MessagesSquare}
          label="Unread messages"
          value={unread}
          sub={`${threads.length} conversation(s)`}
          tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Your projects</h2>
          <Link
            to="/portal/projects"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {projects.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">No projects yet.</p>
          ) : (
            projects.slice(0, 5).map((p) => {
              const progress = projectProgress(p);
              return (
                <Link
                  key={p._id || p.id}
                  to={`/portal/projects/${p._id || p.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                      {p.name}
                    </p>
                    <div className="mt-1.5 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      STATUS_STYLES[p.status] || STATUS_STYLES.draft
                    }`}
                  >
                    {(p.status || 'draft').replace('_', ' ')}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
