import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusMap = {
  active: "green",
  won: "green",
  completed: "green",
  paid: "green",

  inactive: "red",
  churned: "red",
  lost: "red",
  cancelled: "red",
  void: "red",

  in_progress: "blue",
  contacted: "blue",
  sent: "blue",

  on_hold: "amber",
  pending: "amber",
  draft: "amber",

  new: "gray",
  todo: "gray",
  lead: "gray",

  overdue: "pulse-red",
  critical: "pulse-red",
  blocked: "pulse-red",

  review: "purple",
  qualified: "purple",
}

const colorClasses = {
  green: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  red: {
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800",
    dot: "bg-rose-500",
  },
  blue: {
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  amber: {
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  gray: {
    badge: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800",
    dot: "bg-slate-500",
  },
  "pulse-red": {
    badge: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 animate-pulse font-semibold",
    dot: "bg-rose-500 animate-ping",
  },
  purple: {
    badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800",
    dot: "bg-purple-500",
  },
}

export function StatusBadge({ status, size = "md", dot = false, className, children, ...props }) {
  const normStatus = (status || "").toLowerCase().trim();
  const colorKey = statusMap[normStatus] || "gray";
  const classes = colorClasses[colorKey];

  const formattedLabel = children || normStatus
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[0.7rem] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-colors border",
        classes.badge,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {colorKey === "pulse-red" && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          )}
          <span className={cn("relative inline-flex rounded-full h-2 w-2", classes.dot)}></span>
        </span>
      )}
      {formattedLabel}
    </Badge>
  )
}
