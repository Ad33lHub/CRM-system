import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Input } from '../../components/ui/input.jsx';
import { CheckSquare, Calendar } from 'lucide-react';
import { 
  useGetTasksQuery, 
  useUpdateTaskStatusMutation 
} from '../../services/tasksApi.js';

import { toast } from 'sonner';

export default function TasksPage() {
  const navigate = useNavigate();

  
  // States
  const [viewMode, setViewMode] = useState('board'); // board or list
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Queries & Mutations
  const { data: tasksData, isLoading, refetch } = useGetTasksQuery();
  const [updateStatusApi] = useUpdateTaskStatusMutation();

  const tasks = tasksData?.data || tasksData || [];

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateStatusApi({ id: taskId, status: newStatus }).unwrap();
      toast.success('Task status updated successfully!');
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update status');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
      case 'medium': return 'bg-blue-50 text-blue-700 border-blue-150 dark:bg-blue-950/20 dark:text-blue-400';
      case 'high': return 'bg-amber-50 text-amber-700 border-amber-150 dark:bg-amber-950/20 dark:text-amber-400';
      case 'critical': return 'bg-rose-50 text-rose-700 border-rose-150 dark:bg-rose-950/20 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredTasks = tasks.filter(t => {
    const titleMatch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const priorityMatch = priorityFilter === 'all' || t.priority === priorityFilter;
    return titleMatch && priorityMatch;
  });

  const columns = [
    { id: 'todo', name: 'To Do' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'review', name: 'In Review' },
    { id: 'testing', name: 'Testing' },
    { id: 'done', name: 'Done' }
  ];


  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Sprints Board"
        subtitle="Manage sprints, track assignments, and view deliverable progress"
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
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 grid-cols-5 gap-4 overflow-x-auto pb-4 select-none">
          {columns.map((col) => {
            const columnTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 min-h-[300px] flex flex-col space-y-3 min-w-[200px]">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{col.name}</span>
                  <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                    {columnTasks.length}
                  </Badge>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 max-h-[60vh]">
                  {columnTasks.map((t) => (
                    <Card
                      key={t.id || t._id}
                      onClick={() => navigate(`/tasks/${t.id || t._id}`)}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 hover:shadow-md transition-all cursor-pointer space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <Badge className={`text-[9px] uppercase tracking-wide border font-bold ${getPriorityColor(t.priority)}`}>
                          {t.priority}
                        </Badge>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2">
                        {t.title}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        {t.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <select
                          value={t.status}
                          aria-label="Change Status"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(t.id || t._id, e.target.value)}
                          className="bg-transparent border-0 text-[10px] text-blue-500 font-bold focus:outline-none focus:ring-0 cursor-pointer"
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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
                      <Badge className="capitalize text-[10px]">
                        {t.status.replace('_', ' ')}
                      </Badge>
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
    </div>
  );
}
