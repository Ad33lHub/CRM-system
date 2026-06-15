import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog.jsx';
import { Button } from '../../../components/ui/button.jsx';
import { Input } from '../../../components/ui/input.jsx';
import { useCreateTaskMutation } from '../../../services/tasksApi.js';
import { useGetProjectsQuery } from '../../../services/projectsApi.js';
import { useGetEmployeesQuery } from '../../../services/employeesApi.js';

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'testing', label: 'Testing' },
  { value: 'done', label: 'Done' },
];

const fieldLabel =
  'text-xs font-semibold text-slate-400 uppercase tracking-wider';
const selectClass =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const EMPTY = {
  title: '',
  description: '',
  project: '',
  assignedTo: '',
  priority: 'medium',
  status: 'todo',
  dueDate: '',
  estimatedHours: '',
};

/**
 * Reusable dialog for creating a task.
 * @param {boolean} open
 * @param {(open: boolean) => void} onOpenChange
 * @param {string} [defaultProjectId] - pre-selected project (e.g. from a project page)
 * @param {boolean} [lockProject] - hide the project picker and force defaultProjectId
 * @param {() => void} [onCreated]
 */
export default function CreateTaskDialog({
  open,
  onOpenChange,
  defaultProjectId = '',
  lockProject = false,
  onCreated,
}) {
  const [form, setForm] = useState({ ...EMPTY, project: defaultProjectId });

  const { data: projectsData } = useGetProjectsQuery({ limit: 100 });
  const { data: employeesData } = useGetEmployeesQuery({ limit: 100 });
  const [createTask, { isLoading }] = useCreateTaskMutation();

  const projects = projectsData?.data || [];
  const employees = employeesData?.data || [];

  // Reset the form whenever the dialog opens.
  useEffect(() => {
    if (open) setForm({ ...EMPTY, project: defaultProjectId });
  }, [open, defaultProjectId]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!form.project) {
      toast.error('Please select a project');
      return;
    }

    const payload = {
      title: form.title.trim(),
      project: form.project,
      priority: form.priority,
      status: form.status,
    };
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.assignedTo) payload.assignedTo = form.assignedTo;
    if (form.dueDate) payload.dueDate = new Date(form.dueDate);
    if (form.estimatedHours) payload.estimatedHours = Number(form.estimatedHours);

    try {
      await createTask(payload).unwrap();
      toast.success('Task created successfully');
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>Add a new deliverable and assign it to a teammate.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="task-title" className={fieldLabel}>
              Title
            </label>
            <Input
              id="task-title"
              value={form.title}
              onChange={setField('title')}
              placeholder="e.g. Implement login page"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="task-desc" className={fieldLabel}>
              Description
            </label>
            <textarea
              id="task-desc"
              value={form.description}
              onChange={setField('description')}
              placeholder="Optional details, acceptance criteria…"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {!lockProject && (
            <div className="space-y-1.5">
              <label htmlFor="task-project" className={fieldLabel}>
                Project
              </label>
              <select
                id="task-project"
                value={form.project}
                onChange={setField('project')}
                className={selectClass}
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="task-assignee" className={fieldLabel}>
              Assign To
            </label>
            <select
              id="task-assignee"
              value={form.assignedTo}
              onChange={setField('assignedTo')}
              className={selectClass}
            >
              <option value="">-- Unassigned --</option>
              {employees.map((emp) => {
                const u = emp.user || {};
                const uid = u._id || u.id;
                if (!uid) return null;
                return (
                  <option key={emp.id || emp._id} value={uid}>
                    {u.firstName} {u.lastName}
                    {emp.designation ? ` · ${emp.designation}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="task-priority" className={fieldLabel}>
                Priority
              </label>
              <select
                id="task-priority"
                value={form.priority}
                onChange={setField('priority')}
                className={selectClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className="capitalize">
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="task-status" className={fieldLabel}>
                Status
              </label>
              <select
                id="task-status"
                value={form.status}
                onChange={setField('status')}
                className={selectClass}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="task-due" className={fieldLabel}>
                Due Date
              </label>
              <Input id="task-due" type="date" value={form.dueDate} onChange={setField('dueDate')} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="task-hours" className={fieldLabel}>
                Est. Hours
              </label>
              <Input
                id="task-hours"
                type="number"
                min="0"
                value={form.estimatedHours}
                onChange={setField('estimatedHours')}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading ? 'Creating…' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
