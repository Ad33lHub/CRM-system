import React from 'react';
import { Link } from 'react-router-dom';
import { useGetPortalProjectsQuery } from '../../services/portalApi.js';
import { FolderKanban, Calendar } from 'lucide-react';
import {
  PROJECT_STATUS_STYLES,
  HEALTH_STYLES,
  projectProgress,
  formatDate,
} from './portal-utils.js';

export default function PortalProjectsPage() {
  const { data, isLoading } = useGetPortalProjectsQuery();
  const projects = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Projects</h1>
        <p className="text-sm text-slate-400">Track status, progress, and deadlines for your engagements.</p>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-slate-400">Loading projects…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <FolderKanban className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No projects yet</h4>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
            Your active projects will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const progress = projectProgress(p);
            return (
              <Link
                key={p._id || p.id}
                to={`/portal/projects/${p._id || p.id}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-bold text-slate-800 transition-colors group-hover:text-blue-600 dark:text-slate-100">
                    {p.name}
                  </h3>
                  <span
                    title={`Health: ${p.health || 'green'}`}
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${HEALTH_STYLES[p.health] || HEALTH_STYLES.green}`}
                  />
                </div>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{p.description}</p>
                )}

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      PROJECT_STATUS_STYLES[p.status] || PROJECT_STATUS_STYLES.draft
                    }`}
                  >
                    {(p.status || 'draft').replace('_', ' ')}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(p.deadline)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
