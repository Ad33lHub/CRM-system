import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Input } from '../../components/ui/input.jsx';
import { CheckSquare, Calendar, GripVertical, Plus } from 'lucide-react';
import {
  useGetTasksQuery,
  useUpdateTaskStatusMutation,
} from '../../services/tasksApi.js';
import CreateTaskDialog from '../../features/tasks/components/CreateTaskDialog.jsx';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';

import { toast } from 'sonner';

// --- Draggable Task Card ---
function DraggableTaskCard({ task, columns, onStatusChange, onNavigate, getPriorityColor }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      data-task-id={task.id || task._id}
      className={`group p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-lg hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-3 ${isDragging ? 'opacity-50 scale-95' : ''}`}
    >
      <div className="flex justify-between items-start gap-2">
        <Badge className={`text-[9px] uppercase tracking-wide border font-bold ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </Badge>
        <GripVertical className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>

      <h4
        className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(`/tasks/${task.id || task._id}`);
        }}
      >
        {task.title}
      </h4>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800/60">
        {task.dueDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0" />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        <select
          value={task.status}
          aria-label="Change Status"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => onStatusChange(task.id || task._id, e.target.value)}
          className="bg-transparent border-0 text-[10px] text-blue-500 font-bold focus:outline-none focus:ring-0 cursor-pointer"
        >
          {columns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// --- Drag Overlay Card (ghost while dragging) ---
function DragOverlayCard({ task, getPriorityColor }) {
  if (!task) return null;
  return (
    <div className="p-3 bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-lg shadow-2xl shadow-blue-500/20 space-y-3 w-[220px] rotate-2 scale-105">
      <div className="flex justify-between items-start gap-2">
        <Badge className={`text-[9px] uppercase tracking-wide border font-bold ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </Badge>
      </div>
      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2">
        {task.title}
      </h4>
    </div>
  );
}

// --- Droppable Column ---
function DroppableColumn({ column, children, isOver, taskCount }) {
  return (
    <div
      data-column-id={column.id}
      className={`p-3 rounded-xl border min-h-[300px] flex flex-col space-y-3 min-w-[200px] transition-all duration-200 ${
        isOver
          ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400/30'
          : 'bg-slate-50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800/80'
      }`}
    >
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {column.name}
        </span>
        <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
          {taskCount}
        </Badge>
      </div>
      <div className="space-y-3 overflow-y-auto flex-1 max-h-[60vh]">
        {children}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const navigate = useNavigate();

  // States
  const [viewMode, setViewMode] = useState('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTask, setActiveTask] = useState(null);
  const [overColumnId, setOverColumnId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Queries & Mutations
  const { data: tasksData, isLoading } = useGetTasksQuery();
  const [updateStatusApi] = useUpdateTaskStatusMutation();

  const tasks = tasksData?.data || tasksData || [];

  // DnD sensors — require 5px movement before starting drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateStatusApi({ id: taskId, status: newStatus }).unwrap();
      toast.success('Task status updated!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
      case 'medium': return 'bg-blue-50 text-blue-700 border-blue-150 dark:bg-blue-950/20 dark:text-blue-400';
      case 'high': return 'bg-amber-50 text-amber-700 border-amber-150 dark:bg-amber-950/20 dark:text-amber-400';
      case 'critical':
      case 'urgent': return 'bg-rose-50 text-rose-700 border-rose-150 dark:bg-rose-950/20 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredTasks = Array.isArray(tasks) ? tasks.filter((t) => {
    const titleMatch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const priorityMatch = priorityFilter === 'all' || t.priority === priorityFilter;
    return titleMatch && priorityMatch;
  }) : [];

  const columns = [
    { id: 'todo', name: 'To Do' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'review', name: 'In Review' },
    { id: 'testing', name: 'Testing' },
    { id: 'done', name: 'Done' },
  ];

  // --- DnD Handlers ---
  const handleDragStart = (event) => {
    const taskId = event.active.id;
    const task = filteredTasks.find((t) => (t.id || t._id) === taskId);
    setActiveTask(task || null);
  };

  const handleDragOver = (event) => {
    const { over } = event;
    if (over) {
      // The over target can be a column or a task card within a column
      setOverColumnId(over.id);
    } else {
      setOverColumnId(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumnId(null);

    if (!over) return;

    const taskId = active.id;
    let targetColumnId = over.id;

    // If dropped over a task card, find which column that task belongs to
    if (!columns.some((c) => c.id === targetColumnId)) {
      const overTask = filteredTasks.find((t) => (t.id || t._id) === targetColumnId);
      if (overTask) {
        targetColumnId = overTask.status;
      } else {
        return;
      }
    }

    // Find the dragged task's current status
    const draggedTask = filteredTasks.find((t) => (t.id || t._id) === taskId);
    if (!draggedTask || draggedTask.status === targetColumnId) return;

    handleStatusChange(taskId, targetColumnId);
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setOverColumnId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Sprints Board"
        subtitle="Manage sprints, track assignments, and view deliverable progress"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        }
      />

      {/* Filters & Toggles */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border">
        <div className="flex flex-1 gap-2 w-full">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks by title..."
            className="h-10"
          />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="flex h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button
            variant={viewMode === 'board' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('board')}
            className="gap-1.5"
          >
            Kanban Board
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-1.5"
          >
            List view
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading tasks...</div>
      ) : viewMode === 'board' ? (
        /* Kanban Board View with Drag & Drop */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4 select-none">
            {columns.map((col) => {
              const columnTasks = filteredTasks.filter((t) => t.status === col.id);
              const isOver = overColumnId === col.id;

              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  tasks={columnTasks}
                  isOver={isOver}
                  columns={columns}
                  onStatusChange={handleStatusChange}
                  onNavigate={navigate}
                  getPriorityColor={getPriorityColor}
                />
              );
            })}
          </div>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            <DragOverlayCard task={activeTask} getPriorityColor={getPriorityColor} />
          </DragOverlay>
        </DndContext>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border rounded-xl">
          <CheckSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No Tasks Scheduled</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your filters or search criteria.
          </p>
        </div>
      ) : (
        /* List View */
        <Card className="border bg-white dark:bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="py-3 px-4">Task Name</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Estimated Hours</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr
                    key={t.id || t._id}
                    onClick={() => navigate(`/tasks/${t.id || t._id}`)}
                    className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {t.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge className={`text-[9px] uppercase tracking-wide border font-bold ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={t.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(t.id || t._id, e.target.value)}
                        className="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                      >
                        {columns.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '--'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                      {t.estimatedHours || 0} hrs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

// --- KanbanColumn: droppable column with draggable task cards ---
import { useDraggable, useDroppable } from '@dnd-kit/core';

function KanbanColumn({ column, tasks, isOver, columns, onStatusChange, onNavigate, getPriorityColor }) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div ref={setNodeRef}>
      <DroppableColumn column={column} isOver={isOver} taskCount={tasks.length}>
        {tasks.map((t) => (
          <DraggableCard
            key={t.id || t._id}
            task={t}
            columns={columns}
            onStatusChange={onStatusChange}
            onNavigate={onNavigate}
            getPriorityColor={getPriorityColor}
          />
        ))}
      </DroppableColumn>
    </div>
  );
}

function DraggableCard({ task, columns, onStatusChange, onNavigate, getPriorityColor }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id || task._id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`transition-all duration-150 ${isDragging ? 'opacity-30 scale-95' : ''}`}
    >
      <DraggableTaskCard
        task={task}
        columns={columns}
        onStatusChange={onStatusChange}
        onNavigate={onNavigate}
        getPriorityColor={getPriorityColor}
      />
    </div>
  );
}
