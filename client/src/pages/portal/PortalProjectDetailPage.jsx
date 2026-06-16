import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetPortalProjectQuery } from '../../services/portalApi.js';
import { ArrowLeft, CheckCircle2, Circle, MessagesSquare, CalendarDays } from 'lucide-react';
import {
  PROJECT_STATUS_STYLES,
  money,
  projectProgress,
  formatDate,
} from './portal-utils.js';

export default function PortalProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetPortalProjectQuery(id);
  const project = data?.data || data;

  if (isLoading) return <p className="py-12 text-center text-slate-400">Loading project…</p>;
  if (!project) {
    return (
      <div className="py-12 text-center">
        <p className="font-bold text-rose-500">Project not found</p>
        <Link to="/portal/projects" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const progress = projectProgress(project);
  const milestones = project.milestones || [];
  const budget = project.budget || {};

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/portal/projects')}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> Projects
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1 max-w-2xl text-sm text-slate-400">{project.description}</p>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
              PROJECT_STATUS_STYLES[project.status] || PROJECT_STATUS_STYLES.draft
            }`}
          >
            {(project.status || 'draft').replace('_', ' ')}
          </span>
        </div>

        <div className="mt-5">
          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-400">
            <span>Overall progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Meta label="Start" value={formatDate(project.startDate)} icon={CalendarDays} />
          <Meta label="Deadline" value={formatDate(project.deadline)} icon={CalendarDays} />
          <Meta label="Budget" value={money(budget.estimated, budget.currency)} />
          <Meta label="Priority" value={(project.priority || 'medium').toUpperCase()} />
        </div>

        <Link
          to={`/portal/messages?projectId=${project._id || project.id}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <MessagesSquare className="h-4 w-4" /> Message project manager
        </Link>
      </div>

      {/* Milestones */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Milestones</h2>
        </div>
        {milestones.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">No milestones defined yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {milestones.map((m, i) => {
              const done = m.status === 'completed';
              return (
                <li key={m._id || i} className="flex items-center gap-3 px-6 py-4">
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {m.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {m.dueDate ? `Due ${formatDate(m.dueDate)}` : 'No due date'} ·{' '}
                      {m.completionPercent || 0}%
                    </p>
                  </div>
                  <span className="text-[11px] font-bold capitalize text-slate-400">
                    {(m.status || 'pending').replace('_', ' ')}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/30">
      <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}
