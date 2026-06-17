import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core';
import {
  CheckSquare,
  Calendar,
  GripVertical,
  Plus,
  Search,
  LayoutGrid,
  List,
  Clock,
  AlertTriangle,
  Loader2,
  CircleDashed,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Input } from '../../components/ui/input.jsx';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '../../components/ui/avatar.jsx';
import { useGetTasksQuery, useUpdateTaskStatusMutation } from '../../services/tasksApi.js';
import CreateTaskDialog from '../../features/tasks/components/CreateTaskDialog.jsx';

// ── Visual config ─────────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'todo', name: 'To Do', dot: 'bg-slate-400', ring: 'ring-slate-200 dark:ring-slate-700' },
  {
    id: 'in_progress',
    name: 'In Progress',
    dot: 'bg-blue-500',
    ring: 'ring-blue-200 dark:ring-blue-800',
  },
  {
    id: 'review',
    name: 'In Review',
    dot: 'bg-violet-500',
    ring: 'ring-violet-200 dark:ring-violet-800',
  },
  { id: 'testing', name: 'Testing', dot: 'bg-amber-500', ring: 'ring-amber-200 dark:ring-amber-800' },
  { id: 'done', name: 'Done', dot: 'bg-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-800' },
];

const PRIORITY = {
  low: { bar: 'bg-slate-300 dark:bg-slate-600', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  medium: { bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  high: { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  critical: { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
  urgent: { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
};

const priorityStyle = (p) => PRIORITY[p] || PRIORITY.low;

const fullName = (u) =>
  u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'User' : 'User';
const initials = (u) => {
  const n = fullName(u);
  return n
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
};
const isOverdue = (task) =>
  task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();

// ── Assignee avatars ───────────────────────────────────────────────────────
function Assignees({ assignees = [] }) {
  if (!assignees.length) {
    return <span className="text-[10px] font-medium text-slate-300 dark:text-slate-600">Unassigned</span>;
  }
  const shown = assignees.slice(0, 3);
  const extra = assignees.length - shown.length;
  return (
    <AvatarGroup size="sm">
      {shown.map((a, i) => (
        <Avatar key={a.user?._id || a.user?.id || i} size="sm" title={fullName(a.user)}>
          {a.user?.avatar ? <AvatarImage src={a.user.avatar} alt={fullName(a.user)} /> : null}
          <AvatarFallback className="bg-slate-200 text-[9px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
            {initials(a.user)}
          </AvatarFallback>
        </Avatar>
      ))}
      {extra > 0 && <AvatarGroupCount className="text-[9px] font-bold">+{extra}</AvatarGroupCount>}
    </AvatarGroup>
  );
}

// ── Task card (presentational) ─────────────────────────────────────────────
function TaskCard({ task, dragging }) {
  const navigate = useNavigate();
  const overdue = isOverdue(task);
  const ps = priorityStyle(task.priority);

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${
        dragging ? 'opacity-50' : ''
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${ps.bar}`} />
      <div className="space-y-2.5 py-3 pl-4 pr-3">
        <div className="flex items-center justify-between gap-2">
          <Badge
            className={`border-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${ps.badge}`}
          >
            {task.priority}
          </Badge>
          <GripVertical className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/tasks/${task.id || task._id}`);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="block w-full text-left text-sm font-bold leading-snug text-slate-800 transition-colors line-clamp-2 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
        >
          {task.title}
        </button>

        {task.description ? (
          <p className="line-clamp-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
            {task.description}
          </p>
        ) : null}

        {task.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
          <div className="flex items-center gap-2 text-[10px] font-medium">
            {task.dueDate ? (
              <span
                className={`inline-flex items-center gap-1 ${
                  overdue ? 'font-bold text-rose-500' : 'text-slate-400'
                }`}
              >
                {overdue ? (
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                ) : (
                  <Calendar className="h-3 w-3 shrink-0" />
                )}
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-300 dark:text-slate-600">
                <Clock className="h-3 w-3 shrink-0" />
                {task.estimatedHours || 0}h
              </span>
            )}
          </div>
          <Assignees assignees={task.assignees} />
        </div>
      </div>
    </div>
  );
}

// ── Drag wrappers ──────────────────────────────────────────────────────────
function DraggableCard({ task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id || task._id,
  });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <TaskCard task={task} dragging={isDragging} />
    </div>
  );
}

function KanbanColumn({ column, tasks, isOver }) {
  const { setNodeRef } = useDroppable({ id: column.id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[320px] min-w-[230px] flex-col rounded-2xl border p-3 transition-all ${
        isOver
          ? `border-transparent bg-slate-50 ring-2 dark:bg-slate-900/60 ${column.ring}`
          : 'border-slate-200/70 bg-slate-50/60 dark:border-slate-800/70 dark:bg-slate-950/30'
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${column.dot}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {column.name}
          </span>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
        {tasks.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-[11px] font-medium text-slate-300 dark:border-slate-800 dark:text-slate-600">
            <CircleDashed className="mb-1 h-4 w-4" />
            No tasks
          </div>
        ) : (
          tasks.map((t) => <DraggableCard key={t.id || t._id} task={t} />)
        )}
      </div>
    </div>
  );
}

// ── Summary stat tile ──────────────────────────────────────────────────────
function StatTile({ icon: Icon, label, value, tint }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tint}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-extrabold leading-none text-slate-800 dark:text-slate-100">
          {value}
        </p>
        <p className="mt-1 truncate text-[11px] font-medium text-slate-400">{label}</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTask, setActiveTask] = useState(null);
  const [overColumnId, setOverColumnId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  // "My Tasks" is always own-scoped (assigned to or created by me) for every role.
  const { data: tasksData, isLoading } = useGetTasksQuery({ scope: 'mine' });
  const [updateStatusApi] = useUpdateTaskStatusMutation();

  const tasks = useMemo(() => {
    const raw = tasksData?.data || tasksData || [];
    return Array.isArray(raw) ? raw : [];
  }, [tasksData]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateStatusApi({ id: taskId, status: newStatus }).unwrap();
      toast.success('Task status updated');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  const filteredTasks = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return tasks.filter((t) => {
      const titleMatch =
        (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q);
      const priorityMatch = priorityFilter === 'all' || t.priority === priorityFilter;
      return titleMatch && priorityMatch;
    });
  }, [tasks, searchTerm, priorityFilter]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter(isOverdue).length,
    }),
    [tasks]
  );

  // ── DnD ──
  const handleDragStart = (e) =>
    setActiveTask(filteredTasks.find((t) => (t.id || t._id) === e.active.id) || null);
  const handleDragOver = (e) => setOverColumnId(e.over ? e.over.id : null);
  const handleDragCancel = () => {
    setActiveTask(null);
    setOverColumnId(null);
  };
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumnId(null);
    if (!over) return;

    let targetColumnId = over.id;
    if (!COLUMNS.some((c) => c.id === targetColumnId)) {
      const overTask = filteredTasks.find((t) => (t.id || t._id) === targetColumnId);
      if (!overTask) return;
      targetColumnId = overTask.status;
    }
    const dragged = filteredTasks.find((t) => (t.id || t._id) === active.id);
    if (!dragged || dragged.status === targetColumnId) return;
    handleStatusChange(active.id, targetColumnId);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tasks"
        subtitle="Everything assigned to you — drag across stages to update progress"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={CheckSquare}
          label="Total tasks"
          value={stats.total}
          tint="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        />
        <StatTile
          icon={Loader2}
          label="In progress"
          value={stats.inProgress}
          tint="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
        />
        <StatTile
          icon={CheckSquare}
          label="Completed"
          value={stats.done}
          tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
        />
        <StatTile
          icon={AlertTriangle}
          label="Overdue"
          value={stats.overdue}
          tint="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks…"
              className="h-10 pl-9"
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="flex shrink-0 items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => setViewMode('board')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'board'
                ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Board
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((c) => (
            <div
              key={c.id}
              className="min-h-[320px] animate-pulse rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 dark:border-slate-800/70 dark:bg-slate-950/30"
            >
              <div className="mb-3 h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-2.5">
                <div className="h-20 rounded-xl bg-white dark:bg-slate-900" />
                <div className="h-20 rounded-xl bg-white dark:bg-slate-900" />
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'board' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 gap-4 overflow-x-auto pb-4 md:grid-cols-3 lg:grid-cols-5">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={filteredTasks.filter((t) => t.status === col.id)}
                isOver={overColumnId === col.id}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            {activeTask ? (
              <div className="w-[230px] rotate-2 scale-105">
                <TaskCard task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <CheckSquare className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No tasks found</h4>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
            Try adjusting your search or priority filter.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden border bg-white dark:bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assignees</th>
                  <th className="px-4 py-3">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTasks.map((t) => {
                  const overdue = isOverdue(t);
                  const ps = priorityStyle(t.priority);
                  return (
                    <tr
                      key={t.id || t._id}
                      onClick={() => navigate(`/tasks/${t.id || t._id}`)}
                      className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td className="max-w-[320px] px-4 py-3.5">
                        <p className="truncate font-bold text-slate-800 dark:text-slate-100">
                          {t.title}
                        </p>
                        {t.description ? (
                          <p className="truncate text-[11px] text-slate-400">{t.description}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          className={`border-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${ps.badge}`}
                        >
                          {t.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          value={t.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(t.id || t._id, e.target.value)}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <Assignees assignees={t.assignees} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs font-medium ${
                            overdue ? 'font-bold text-rose-500' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {t.dueDate
                            ? new Date(t.dueDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
