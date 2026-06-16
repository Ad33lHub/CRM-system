export const PROJECT_STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300',
  on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

export const HEALTH_STYLES = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
};

export const money = (n, c = 'PKR') => `${c} ${Number(n || 0).toLocaleString()}`;

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export function projectProgress(p) {
  const ms = p?.milestones || [];
  if (!ms.length) return p?.status === 'completed' ? 100 : 0;
  return Math.round(ms.reduce((s, m) => s + (m.completionPercent || 0), 0) / ms.length);
}
