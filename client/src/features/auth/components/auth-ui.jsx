import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export function AuthHeading({ title, subtitle }) {
  return (
    <div className="mb-7">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  );
}

const BANNER_VARIANTS = {
  error:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
};

export function AuthBanner({ variant = 'error', icon: Icon, children }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3.5 py-3 text-sm font-medium',
        BANNER_VARIANTS[variant]
      )}
    >
      {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0" /> : null}
      <span>{children}</span>
    </div>
  );
}

/**
 * Labelled text field with an optional left icon, right adornment (e.g. eye toggle),
 * and inline error message. Label sits above the input (not placeholder-only).
 */
export function TextField({ label, id, icon: Icon, error, rightSlot, className, ...inputProps }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        ) : null}
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-11',
            Icon && 'pl-9',
            rightSlot && 'pr-10',
            error && 'border-rose-400 focus-visible:ring-rose-400 dark:border-rose-500/60',
            className
          )}
          {...inputProps}
        />
        {rightSlot ? (
          <div className="absolute right-0 top-0 flex h-full items-center pr-2">{rightSlot}</div>
        ) : null}
      </div>
      {error ? <p className="text-xs font-medium text-rose-500">{error}</p> : null}
    </div>
  );
}
