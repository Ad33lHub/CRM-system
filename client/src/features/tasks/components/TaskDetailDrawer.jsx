import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ExternalLink, CalendarClock, Clock, MessageSquare, Paperclip } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import { useUpdateTaskMutation, useUpdateTaskStatusMutation } from '@/services/tasksApi.js';
import {
  COLUMNS,
  PRIORITY_CONFIG,
  fullName,
  initials,
  userId,
  isOverdue,
  shortKey,
} from './task-config.js';

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const fieldLabel = 'text-[11px] font-bold uppercase tracking-wider text-slate-400';
const selectClass =
  'h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';

export default function TaskDetailDrawer({ task, open, onOpenChange }) {
  const navigate = useNavigate();
  const [updateTaskApi] = useUpdateTaskMutation();
  const [updateStatusApi] = useUpdateTaskStatusMutation();

  if (!task) return null;

  const id = task.id || task._id;
  const overdue = isOverdue(task);
  const assignees = task.assignees || [];
  const commentCount = (task.activityLog || []).filter((l) => l.action === 'comment' || l.note)
    .length;
  const attachmentCount = (task.attachments || []).length;

  const changeStatus = async (status) => {
    try {
      await updateStatusApi({ id, status }).unwrap();
      toast.success('Status updated');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  const changePriority = async (priority) => {
    try {
      await updateTaskApi({ id, data: { priority } }).unwrap();
      toast.success('Priority updated');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update priority');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-slate-100 dark:border-slate-800">
          <span className="font-mono text-[11px] font-semibold text-slate-400">{shortKey(task)}</span>
          <SheetTitle className="text-base leading-snug">{task.title}</SheetTitle>
          <SheetDescription className="sr-only">Task quick view</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {/* status + priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className={fieldLabel}>Status</p>
              <select
                value={task.status}
                onChange={(e) => changeStatus(e.target.value)}
                className={selectClass}
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <p className={fieldLabel}>Priority</p>
              <select
                value={PRIORITIES.includes(task.priority) ? task.priority : 'medium'}
                onChange={(e) => changePriority(e.target.value)}
                className={selectClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_CONFIG[p].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            {task.dueDate && (
              <span className={`inline-flex items-center gap-1 ${overdue ? 'font-bold text-rose-500' : ''}`}>
                <CalendarClock className="size-3.5" />
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {overdue && ' · Overdue'}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {task.loggedHours || 0}/{task.estimatedHours || 0}h
            </span>
            {commentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="size-3.5" />
                {commentCount}
              </span>
            )}
            {attachmentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="size-3.5" />
                {attachmentCount}
              </span>
            )}
          </div>

          {/* description */}
          <div className="space-y-1.5">
            <p className={fieldLabel}>Description</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* assignees */}
          <div className="space-y-2">
            <p className={fieldLabel}>Assignees</p>
            {assignees.length ? (
              <ul className="space-y-2">
                {assignees.map((a, i) => (
                  <li key={userId(a.user) || i} className="flex items-center gap-2">
                    <Avatar size="sm">
                      {a.user?.avatar ? (
                        <AvatarImage src={a.user.avatar} alt={fullName(a.user)} />
                      ) : null}
                      <AvatarFallback className="bg-slate-200 text-[9px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                        {initials(a.user)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-700 dark:text-slate-200">
                      {fullName(a.user)}
                    </span>
                    {a.isPrimary && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                        Owner
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Unassigned</p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <Button
            className="w-full gap-2"
            onClick={() => {
              onOpenChange(false);
              navigate(`/tasks/${id}`);
            }}
          >
            <ExternalLink className="size-4" />
            Open full details
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
