import React from 'react';
import { MessageSquare, Paperclip, CalendarClock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar';
import {
  priorityConfig,
  fullName,
  initials,
  userId,
  isOverdue,
  shortKey,
} from './task-config.js';

function Assignees({ assignees = [] }) {
  if (!assignees.length) {
    return (
      <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-slate-300 text-[9px] font-bold text-slate-300 dark:border-slate-700 dark:text-slate-600">
        ?
      </span>
    );
  }
  const shown = assignees.slice(0, 3);
  const extra = assignees.length - shown.length;
  return (
    <AvatarGroup size="sm">
      {shown.map((a, i) => (
        <Avatar key={userId(a.user) || i} size="sm" title={fullName(a.user)}>
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

/**
 * Presentational Jira-style task card.
 * `overlay` = rendered inside DragOverlay (lifted look); `dragging` = source placeholder.
 * `interactive=false` lets a draggable wrapper own focus/click (avoids a double tab stop).
 */
export default function TaskCard({
  task,
  onOpen,
  dragging = false,
  overlay = false,
  interactive = true,
}) {
  const pc = priorityConfig(task.priority);
  const PIcon = pc.icon;
  const overdue = isOverdue(task);
  const assignees = task.assignees || [];
  const commentCount = (task.activityLog || []).filter((l) => l.action === 'comment' || l.note)
    .length;
  const attachmentCount = (task.attachments || []).length;
  const tags = task.tags || [];

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive && !overlay ? 0 : undefined}
      onClick={interactive ? () => onOpen?.(task) : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen?.(task);
              }
            }
          : undefined
      }
      className={cn(
        'group rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-all',
        'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'dark:border-slate-700/70 dark:bg-slate-900 dark:hover:border-slate-600',
        dragging && 'opacity-40',
        overlay && 'rotate-2 scale-[1.03] cursor-grabbing border-blue-300 shadow-xl dark:border-blue-600'
      )}
    >
      {/* labels */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            pc.chip
          )}
        >
          <PIcon className="size-3" />
          {pc.label}
        </span>
        {tags.slice(0, 2).map((t) => (
          <span
            key={t}
            className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          >
            {t}
          </span>
        ))}
      </div>

      {/* title */}
      <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
        {task.title}
      </p>

      {/* footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-[11px] font-medium text-slate-400">
          <span className="font-mono text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            {shortKey(task)}
          </span>
          {commentCount > 0 && (
            <span className="inline-flex items-center gap-0.5" title={`${commentCount} comments`}>
              <MessageSquare className="size-3.5" />
              {commentCount}
            </span>
          )}
          {attachmentCount > 0 && (
            <span
              className="inline-flex items-center gap-0.5"
              title={`${attachmentCount} attachments`}
            >
              <Paperclip className="size-3.5" />
              {attachmentCount}
            </span>
          )}
          {task.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5',
                overdue && 'font-bold text-rose-500'
              )}
              title={overdue ? 'Overdue' : 'Due date'}
            >
              {overdue ? (
                <AlertTriangle className="size-3.5" />
              ) : (
                <CalendarClock className="size-3.5" />
              )}
              {new Date(task.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
        <Assignees assignees={assignees} />
      </div>
    </div>
  );
}
