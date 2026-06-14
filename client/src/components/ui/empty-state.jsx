import * as React from "react"
import { FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon: Icon = FolderOpen,
  title = "No records found",
  description = "Get started by creating a new entry.",
  action,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 min-h-[320px] rounded-lg border border-dashed border-border bg-card/50",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center p-4 rounded-full bg-muted/40 mb-4">
        {Icon && <Icon className="h-10 w-10 text-muted-foreground/80" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          {description}
        </p>
      )}
      {action && action.label && action.onClick && (
        <Button
          onClick={action.onClick}
          className="mt-6"
          variant="default"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
