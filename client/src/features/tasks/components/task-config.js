// Shared presentation config + helpers for the task board.
// Pure data/helpers only — no JSX — so cards, columns, and the drawer agree.
import { ChevronDown, Equal, ChevronUp, ChevronsUp } from 'lucide-react';

export const COLUMNS = [
  { id: 'todo', name: 'To Do' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'review', name: 'In Review' },
  { id: 'testing', name: 'Testing' },
  { id: 'done', name: 'Done' },
];

export const STATUS_IDS = COLUMNS.map((c) => c.id);
export const statusName = (id) => COLUMNS.find((c) => c.id === id)?.name || id;

// Priority order (high → low) for sorting.
export const PRIORITY_RANK = { critical: 0, urgent: 0, high: 1, medium: 2, low: 3 };

export const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    icon: ChevronDown,
    chip: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    icon_color: 'text-slate-400',
  },
  medium: {
    label: 'Medium',
    icon: Equal,
    chip: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
    icon_color: 'text-blue-500',
  },
  high: {
    label: 'High',
    icon: ChevronUp,
    chip: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    icon_color: 'text-amber-500',
  },
  critical: {
    label: 'Critical',
    icon: ChevronsUp,
    chip: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    icon_color: 'text-rose-500',
  },
  urgent: {
    label: 'Urgent',
    icon: ChevronsUp,
    chip: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    icon_color: 'text-rose-500',
  },
};

export const priorityConfig = (p) => PRIORITY_CONFIG[p] || PRIORITY_CONFIG.low;

export const taskId = (task) => task?.id || task?._id;
export const userId = (u) => u?._id || u?.id || u?.sub;

export const fullName = (u) =>
  u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'User' : 'User';

export const initials = (u) =>
  fullName(u)
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const isOverdue = (task) =>
  task?.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();

// Jira-style short key derived from the Mongo id (no human key exists in this schema).
export const shortKey = (task) => {
  const raw = String(taskId(task) || '');
  return raw ? `TASK-${raw.slice(-4).toUpperCase()}` : 'TASK';
};

// Distinct assignee users across the given tasks, for the quick-filter avatar row.
export const collectAssignees = (tasks) => {
  const map = new Map();
  tasks.forEach((t) =>
    (t.assignees || []).forEach((a) => {
      const id = userId(a.user);
      if (id && !map.has(id)) map.set(id, a.user);
    })
  );
  return Array.from(map.values());
};

// Board-wide sort applied within each column.
export const SORT_OPTIONS = [
  { value: 'default', label: 'Default order' },
  { value: 'priority', label: 'Priority' },
  { value: 'due', label: 'Due date' },
  { value: 'recent', label: 'Recently updated' },
];

export const sortTasks = (tasks, sortKey) => {
  const list = [...tasks];
  switch (sortKey) {
    case 'priority':
      return list.sort(
        (a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9)
      );
    case 'due':
      return list.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    case 'recent':
      return list.sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );
    default:
      return list;
  }
};
