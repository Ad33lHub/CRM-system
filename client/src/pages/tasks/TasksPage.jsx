import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  closestCorners,
} from '@dnd-kit/core';
import { Plus, Search, LayoutGrid, List, X, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useGetTasksQuery, useUpdateTaskStatusMutation } from '@/services/tasksApi.js';
import useAuth from '@/hooks/useAuth.js';
import CreateTaskDialog from '@/features/tasks/components/CreateTaskDialog.jsx';
import TaskCard from '@/features/tasks/components/TaskCard.jsx';
import TaskColumn from '@/features/tasks/components/TaskColumn.jsx';
import TaskDetailDrawer from '@/features/tasks/components/TaskDetailDrawer.jsx';
import {
  COLUMNS,
  STATUS_IDS,
  statusName,
  taskId,
  userId,
  fullName,
  initials,
  isOverdue,
  sortTasks,
  collectAssignees,
} from '@/features/tasks/components/task-config.js';

// Draggable wrapper (whole card). Click opens the drawer; drag starts after 8px move.
function DraggableCard({ task, onOpen }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: taskId(task) });
  return (
    // dnd-kit's {...attributes}/{...listeners} supply role, tabIndex, and keyboard pickup handlers.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      className="cursor-grab touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:cursor-grabbing"
    >
      <TaskCard task={task} dragging={isDragging} interactive={false} />
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const myId = userId(user);

  const [viewMode, setViewMode] = useState('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [sortKey, setSortKey] = useState('default');
  const [collapsed, setCollapsed] = useState([]);
  const [mobileTab, setMobileTab] = useState('todo');

  const [activeTask, setActiveTask] = useState(null);
  const [overColumnId, setOverColumnId] = useState(null);

  const [drawerTask, setDrawerTask] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // "My Tasks" is always own-scoped (assigned to or created by me) for every role.
  const { data: tasksData, isLoading } = useGetTasksQuery({ scope: 'mine' });
  const [updateStatusApi] = useUpdateTaskStatusMutation();

  const tasks = useMemo(() => {
    const raw = tasksData?.data || tasksData || [];
    return Array.isArray(raw) ? raw : [];
  }, [tasksData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const assigneePool = useMemo(() => collectAssignees(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesSearch =
        !q ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q);
      const ids = (t.assignees || []).map((a) => userId(a.user));
      const matchesAssignee = !selectedAssignees.length || ids.some((id) => selectedAssignees.includes(id));
      const matchesMine = !onlyMine || (myId && ids.includes(myId));
      return matchesSearch && matchesAssignee && matchesMine;
    });
  }, [tasks, searchTerm, selectedAssignees, onlyMine, myId]);

  const tasksByColumn = useMemo(() => {
    const map = {};
    STATUS_IDS.forEach((id) => {
      map[id] = sortTasks(
        filteredTasks.filter((t) => t.status === id),
        sortKey
      );
    });
    return map;
  }, [filteredTasks, sortKey]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatusApi({ id, status }).unwrap();
      toast.success('Task moved');
    } catch (err) {
      toast.error(err?.data?.message || 'Move failed — card returned to its column');
    }
  };

  const openDrawer = (task) => {
    setDrawerTask(task);
    setDrawerOpen(true);
  };

  const openCreate = () => setCreateOpen(true);

  const toggleAssignee = (id) =>
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleCollapse = (id) =>
    setCollapsed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const hasActiveFilters = searchTerm || selectedAssignees.length || onlyMine;
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedAssignees([]);
    setOnlyMine(false);
  };

  // ── DnD ──
  const handleDragStart = (e) =>
    setActiveTask(filteredTasks.find((t) => taskId(t) === e.active.id) || null);
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
    if (!STATUS_IDS.includes(targetColumnId)) {
      const overTask = filteredTasks.find((t) => taskId(t) === targetColumnId);
      if (!overTask) return;
      targetColumnId = overTask.status;
    }
    const dragged = filteredTasks.find((t) => taskId(t) === active.id);
    // Within-column drop = reorder only (no status change persisted in this schema).
    if (!dragged || dragged.status === targetColumnId) return;
    handleStatusChange(active.id, targetColumnId);
  };

  const renderDraggable = (t) => <DraggableCard key={taskId(t)} task={t} onOpen={openDrawer} />;
  const renderPlain = (t) => <TaskCard key={taskId(t)} task={t} onOpen={openDrawer} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Tasks"
        subtitle="Drag cards across columns to update status"
        actions={
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" /> Create
          </Button>
        }
      />

      {/* Toolbar: search + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search board…"
            className="h-10 pl-9"
          />
        </div>
        <div className="flex shrink-0 items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950/40">
          {[
            { id: 'board', icon: LayoutGrid, label: 'Board' },
            { id: 'list', icon: List, label: 'List' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewMode(id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all',
                viewMode === id
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          {assigneePool.length === 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
              <UserRound className="size-3.5" /> No assignees
            </span>
          ) : (
            assigneePool.slice(0, 8).map((u) => {
              const id = userId(u);
              const active = selectedAssignees.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  title={fullName(u)}
                  onClick={() => toggleAssignee(id)}
                  className={cn(
                    'rounded-full ring-2 ring-transparent transition-all hover:opacity-100',
                    active ? 'ring-blue-500' : 'opacity-60'
                  )}
                >
                  <Avatar size="sm">
                    {u?.avatar ? <AvatarImage src={u.avatar} alt={fullName(u)} /> : null}
                    <AvatarFallback className="bg-slate-200 text-[9px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                      {initials(u)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              );
            })
          )}
        </div>

        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Switch
            checked={onlyMine}
            onCheckedChange={setOnlyMine}
            aria-label="Only my issues"
          />
          Only my issues
        </span>

        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Switch
            checked={sortKey === 'recent'}
            onCheckedChange={(v) => setSortKey(v ? 'recent' : 'default')}
            aria-label="Recently updated"
          />
          Recently updated
        </span>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-500"
          >
            <X className="size-3.5" /> Clear
          </button>
        ) : null}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {COLUMNS.map((c) => (
            <div
              key={c.id}
              className="w-[280px] shrink-0 rounded-lg border border-slate-200 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <Skeleton className="mb-3 h-4 w-24" />
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <ListView
          tasks={sortTasks(filteredTasks, sortKey === 'default' ? 'recent' : sortKey)}
          onOpen={openDrawer}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <>
          {/* Desktop board */}
          <div className="hidden md:block">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <div className="flex gap-3 overflow-x-auto pb-4 [scrollbar-width:thin]">
                {COLUMNS.map((col) => (
                  <TaskColumn
                    key={col.id}
                    column={col}
                    tasks={tasksByColumn[col.id]}
                    isOver={overColumnId === col.id}
                    collapsed={collapsed.includes(col.id)}
                    onToggleCollapse={toggleCollapse}
                    sortKey={sortKey}
                    onSortChange={setSortKey}
                    onCreate={openCreate}
                    renderTask={renderDraggable}
                  />
                ))}
              </div>
              <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
                {activeTask ? (
                  <div className="w-[264px]">
                    <TaskCard task={activeTask} overlay />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Mobile: single column with switcher tabs */}
          <div className="md:hidden">
            <Tabs value={mobileTab} onValueChange={setMobileTab}>
              <TabsList className="flex w-full overflow-x-auto">
                {COLUMNS.map((col) => (
                  <TabsTrigger key={col.id} value={col.id} className="gap-1.5 whitespace-nowrap">
                    {col.name}
                    <span className="rounded bg-slate-200 px-1 text-[10px] font-bold dark:bg-slate-700">
                      {tasksByColumn[col.id].length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {COLUMNS.map((col) => (
                <TabsContent key={col.id} value={col.id} className="mt-3 space-y-2">
                  {tasksByColumn[col.id].length === 0 ? (
                    <button
                      type="button"
                      onClick={openCreate}
                      className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-10 text-slate-400 dark:border-slate-800"
                    >
                      <span className="text-xs font-semibold">No issues</span>
                      <span className="text-[11px] font-medium text-blue-500">+ Create issue</span>
                    </button>
                  ) : (
                    tasksByColumn[col.id].map((t) => renderPlain(t))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </>
      )}

      <TaskDetailDrawer task={drawerTask} open={drawerOpen} onOpenChange={setDrawerOpen} />
      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

// ── List view ──────────────────────────────────────────────────────────────
function ListView({ tasks, onOpen, onStatusChange }) {
  if (!tasks.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="font-semibold text-slate-600 dark:text-slate-300">No issues found</p>
        <p className="mt-1 text-sm text-slate-400">Try adjusting your search or filters.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
            <th className="px-4 py-3">Task</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {tasks.map((t) => {
            const overdue = isOverdue(t);
            return (
              <tr
                key={taskId(t)}
                onClick={() => onOpen(t)}
                className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
              >
                <td className="max-w-[420px] px-4 py-3">
                  <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                    {t.title}
                  </p>
                  {t.description ? (
                    <p className="truncate text-[11px] text-slate-400">{t.description}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={t.status}
                    onChange={(e) => onStatusChange(taskId(t), e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {statusName(c.id)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'text-xs font-medium text-slate-500 dark:text-slate-400',
                      overdue && 'font-bold text-rose-500'
                    )}
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
  );
}
