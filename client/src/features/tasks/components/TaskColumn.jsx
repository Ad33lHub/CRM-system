import React, { useEffect, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { MoreHorizontal, Plus, PanelLeftClose, PanelLeftOpen, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SORT_OPTIONS } from './task-config.js';

// Count badge that briefly pulses whenever its value changes (card moved in/out).
function CountBadge({ count }) {
  const [pulse, setPulse] = useState(false);
  const prev = useRef(count);
  useEffect(() => {
    if (prev.current !== count) {
      prev.current = count;
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 450);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [count]);
  return (
    <span
      className={cn(
        'min-w-[20px] rounded bg-slate-200 px-1.5 py-0.5 text-center text-[11px] font-bold text-slate-600 transition-transform dark:bg-slate-800 dark:text-slate-300',
        pulse && 'scale-125 bg-blue-200 text-blue-700 dark:bg-blue-500/30 dark:text-blue-200'
      )}
    >
      {count}
    </span>
  );
}

export default function TaskColumn({
  column,
  tasks,
  isOver,
  collapsed,
  onToggleCollapse,
  sortKey,
  onSortChange,
  onCreate,
  renderTask,
  droppable = true,
}) {
  const { setNodeRef } = useDroppable({ id: column.id, disabled: !droppable });

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => onToggleCollapse(column.id)}
        title={`Expand ${column.name}`}
        className="flex h-full min-h-[400px] w-12 shrink-0 flex-col items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 py-3 text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-900"
      >
        <PanelLeftOpen className="size-4" />
        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold dark:bg-slate-800">
          {tasks.length}
        </span>
        <span className="mt-1 [writing-mode:vertical-rl] text-xs font-bold uppercase tracking-wider">
          {column.name}
        </span>
      </button>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex max-h-full min-h-[400px] w-[280px] shrink-0 flex-col rounded-lg border p-2 transition-colors',
        isOver
          ? 'border-2 border-dashed border-blue-400 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-950/20'
          : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40'
      )}
    >
      {/* header */}
      <div className="mb-2 flex items-center justify-between gap-2 px-1.5 py-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {column.name}
          </span>
          <CountBadge count={tasks.length} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label={`${column.name} options`}
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sortKey} onValueChange={onSortChange}>
              {SORT_OPTIONS.map((o) => (
                <DropdownMenuRadioItem key={o.value} value={o.value}>
                  {o.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onToggleCollapse(column.id)}>
              <PanelLeftClose className="size-4" />
              Collapse column
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreate(column.id)}>
              <Plus className="size-4" />
              Create issue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-0.5 pb-1 [scrollbar-width:thin]">
        {tasks.length === 0 ? (
          <button
            type="button"
            onClick={() => onCreate(column.id)}
            className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-10 text-slate-400 transition-colors hover:border-blue-300 hover:text-blue-500 dark:border-slate-800"
          >
            <Inbox className="size-5" />
            <span className="text-xs font-semibold">No issues</span>
            <span className="text-[11px] font-medium text-blue-500">+ Create issue</span>
          </button>
        ) : (
          tasks.map((t) => renderTask(t))
        )}
      </div>
    </div>
  );
}
