"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Task } from "@/lib/types"

type DeleteTaskDialogProps = {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onTaskDeleted?: (taskId: string) => void
}

export default function DeleteTaskDialog({ task, isOpen, onClose, onTaskDeleted }: DeleteTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!task) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        onTaskDeleted?.(task.id)

        // Show success toast
        import("@/lib/toast-utils").then(({ successToast }) => {
          successToast({
            title: "Task Deleted",
            description: "The task has been successfully deleted.",
          })
        })

        onClose()
      } else {
        // Show error toast
        import("@/lib/toast-utils").then(({ errorToast }) => {
          errorToast({
            title: "Delete Failed",
            description: data.error || "Failed to delete task. Please try again.",
          })
        })
        console.error("Failed to delete task:", data.error)
      }
    } catch (error) {
      // Show error toast
      import("@/lib/toast-utils").then(({ errorToast }) => {
        errorToast({
          title: "Delete Failed",
          description: "An unexpected error occurred. Please try again.",
        })
      })
      console.error("Failed to delete task:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle>Delete Task</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete "{task.title}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Deleting...</span>
              </div>
            ) : (
              "Delete Task"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
