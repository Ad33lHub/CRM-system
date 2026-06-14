import * as React from "react"
import { Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you absolutely sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
}) {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleConfirm = React.useCallback(async (e) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    try {
      await onConfirm()
    } catch (err) {
      console.error("Error during confirmation action:", err)
    } finally {
      setIsLoading(false)
      onOpenChange(false)
    }
  }, [onConfirm, onOpenChange])

  // Keyboard shortcut: Enter confirms
  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      // Avoid triggering if the user is focused on the Cancel button
      if (e.key === "Enter" && !isLoading) {
        const activeEl = document.activeElement
        if (activeEl && activeEl.getAttribute("data-cancel-button") === "true") {
          return
        }
        e.preventDefault()
        handleConfirm()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, isLoading, handleConfirm])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              disabled={isLoading}
              data-cancel-button="true"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            disabled={isLoading}
            onClick={handleConfirm}
            className="min-w-[80px]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
