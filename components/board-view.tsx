"use client"

import { useEffect, useState } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { useAppStore } from "@/lib/store"
import { useSearchFilterStore } from "@/lib/search-filter-store"
import { taskApi } from "@/lib/api"
import { type Task, Status } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/lib/user-context"
import TaskDetailModal from "./task-detail-modal"
import UpdateTaskModal from "./tasks/update-task-modal"
import DeleteTaskDialog from "./tasks/delete-task-dialog"
import TaskColumn from "./tasks/TaskColumn"
import { commentService } from "@/lib/services/comment-service"

type BoardProps = {
  projectId: string
  setIsModalNewTaskOpen: (isOpen: boolean) => void
}

const taskStatus = [Status?.ToDo, Status?.WorkInProgress, Status?.UnderReview, Status?.Completed]

export default function BoardView({ projectId, setIsModalNewTaskOpen }: BoardProps) {
  const { tasks, setTasks, updateTaskStatus, isLoading, setLoading, setError } = useAppStore()
  const { filterTasks } = useSearchFilterStore()
  const { toast } = useToast()
  const { currentWorkspace } = useUser()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taskToUpdate, setTaskToUpdate] = useState<Task | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})

  // Queue for background API calls
  const [updateQueue, setUpdateQueue] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true)
      try {
        const response = await taskApi.getTasks(projectId)
        if (response.success && response.data) {
          setTasks(response.data)
          // Fetch comment counts for all tasks using Firebase
          await fetchCommentCounts(response.data)
        } else {
          setError(response.error || "Failed to fetch tasks")
        }
      } catch (error) {
        setError(`Network error occurred ${error}`)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [projectId, setTasks, setLoading, setError])

  // Fetch comment counts for all tasks using Firebase
  const fetchCommentCounts = async (taskList: Task[]) => {
    if (!currentWorkspace?.id) return

    try {
      const counts: Record<string, number> = {}

      // Fetch comment counts for all tasks in parallel
      const countPromises = taskList.map(async (task) => {
        try {
          const count = await commentService.getCommentCount(task.id, currentWorkspace.id)
          counts[task.id] = count
        } catch (error) {
          console.error(`Failed to fetch comment count for task ${task.id}:`, error)
          counts[task.id] = 0
        }
      })

      await Promise.all(countPromises)
      setCommentCounts(counts)
    } catch (error) {
      console.error("Failed to fetch comment counts:", error)
    }
  }

  // Apply search and filters
  const filteredTasks = filterTasks(tasks)

  // Fast drag and drop with background API calls
  const moveTask = async (taskId: string, toStatus: Status) => {
    // Find the task being moved
    const taskToMove = tasks.find((task) => task.id === taskId)
    if (!taskToMove) {
      return
    }

    // If the task is already in the target status, do nothing
    if (taskToMove.status === toStatus) {
      return
    }

    // Store original status for potential rollback
    const originalStatus = taskToMove.status

    // 1. INSTANT UI UPDATE - No waiting!
    updateTaskStatus(taskId, toStatus)

    // 2. BACKGROUND API CALL - Don't wait for it
    setUpdateQueue((prev) => new Set(prev).add(taskId))

    // Make the API call in the background
    taskApi
      .updateTaskStatus(taskId, toStatus)
      .then((response) => {
        // Remove from queue when done
        setUpdateQueue((prev) => {
          const newQueue = new Set(prev)
          newQueue.delete(taskId)
          return newQueue
        })

        if (response.success && response.data) {
          // Silently update with any server data if needed
          const updatedTasks = tasks.map((task) =>
            task.id === taskId ? { ...task, ...response.data, status: toStatus } : task,
          )
          setTasks(updatedTasks)
        } else {
          // Silent rollback on failure
          updateTaskStatus(taskId, originalStatus)

          // Show a subtle error toast
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Task status couldn't be saved. Please try again.",
            duration: 3000,
          })
        }
      })
      .catch((error) => {
        // Remove from queue
        setUpdateQueue((prev) => {
          const newQueue = new Set(prev)
          newQueue.delete(taskId)
          return newQueue
        })

        // Silent rollback on error
        updateTaskStatus(taskId, originalStatus)

        // Show a subtle error toast
        toast({
          variant: "destructive",
          title: "Network Error",
          description: "Couldn't save changes. Please check your connection.",
          duration: 3000,
        })

        console.error("Failed to update task status:", error)
      })
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsTaskDetailOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setTaskToUpdate(task)
    setIsUpdateModalOpen(true)
  }

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task)
    setIsDeleteDialogOpen(true)
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    const updatedTasks = tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    setTasks(updatedTasks)
    setTaskToUpdate(null)

    // Refresh comment count for the updated task using Firebase
    if (currentWorkspace?.id) {
      commentService
        .getCommentCount(updatedTask.id, currentWorkspace.id)
        .then((count) => {
          setCommentCounts((prev) => ({
            ...prev,
            [updatedTask.id]: count,
          }))
        })
        .catch((error) => {
          console.error("Failed to refresh comment count:", error)
        })
    }
  }

  const handleTaskDeleted = (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId)
    setTasks(updatedTasks)
    setTaskToDelete(null)

    // Remove comment count for deleted task
    setCommentCounts((prev) => {
      const newCounts = { ...prev }
      delete newCounts[taskId]
      return newCounts
    })
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await taskApi.updateTask(taskId, updates)
      if (response.success && response.data) {
        const updatedTasks = tasks.map((task) => (task.id === taskId ? response.data! : task))
        setTasks(updatedTasks)
        setSelectedTask(response.data)

        // Refresh comment count using Firebase
        if (currentWorkspace?.id) {
          const count = await commentService.getCommentCount(response.data.id, currentWorkspace.id)
          setCommentCounts((prev) => ({
            ...prev,
            [response.data.id]: count,
          }))
        }
      }
    } catch (error) {
      console.error("Failed to update task:", error)
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update task. Please try again.",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 gap-1 p-6 md:grid-cols-2 xl:grid-cols-4 bg-gray-50 min-h-screen custom-scrollbar">
        {taskStatus.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={filteredTasks}
            moveTask={moveTask}
            setIsModalNewTaskOpen={setIsModalNewTaskOpen}
            onTaskClick={handleTaskClick}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            commentCounts={commentCounts}
          />
        ))}
      </div>

      {/* Subtle background sync indicator - only show if many tasks are syncing */}
      {updateQueue.size > 3 && (
        <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center space-x-2 text-blue-700">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Syncing {updateQueue.size} tasks...</span>
          </div>
        </div>
      )}

      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false)
          setSelectedTask(null)
        }}
        onUpdateTask={handleUpdateTask}
      />

      <UpdateTaskModal
        task={taskToUpdate}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false)
          setTaskToUpdate(null)
        }}
        onTaskUpdated={handleTaskUpdated}
      />

      <DeleteTaskDialog
        task={taskToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setTaskToDelete(null)
        }}
        onTaskDeleted={handleTaskDeleted}
      />
    </DndProvider>
  )
}
