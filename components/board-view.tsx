"use client"

import { useEffect, useState } from "react"
import { DndProvider} from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { useAppStore } from "@/lib/store"
import { taskApi } from "@/lib/api"
import { type Task, Status } from "@/lib/types"
import TaskDetailModal from "./task-detail-modal"
import UpdateTaskModal from "./tasks/update-task-modal"
import DeleteTaskDialog from "./tasks/delete-task-dialog"
import {  taskStatus } from "@/lib/constants"
import TaskColumn from "./tasks/TaskColumn"

type BoardProps = {
  projectId: string
  setIsModalNewTaskOpen: (isOpen: boolean) => void
}


export default function BoardView({ projectId, setIsModalNewTaskOpen }: BoardProps) {
  const { tasks, setTasks, updateTaskStatus, isLoading, setLoading, setError } = useAppStore()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taskToUpdate, setTaskToUpdate] = useState<Task | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true)
      try {
        const response = await taskApi.getTasks(projectId)
        if (response.success && response.data) {
          setTasks(response.data)
        } else {
          setError(response.error || "Failed to fetch tasks")
        }
      } catch (error) {
        setError("Network error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [projectId, setTasks, setLoading, setError])

  const moveTask = async (taskId: string, toStatus: Status) => {
    updateTaskStatus(taskId, toStatus)

    try {
      await taskApi.updateTaskStatus(taskId, toStatus)
    } catch (error) {
      console.error("Failed to update task status:", error)
    }
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
  }

  const handleTaskDeleted = (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId)
    setTasks(updatedTasks)
    setTaskToDelete(null)
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await taskApi.updateTask(taskId, updates)
      if (response.success && response.data) {
        const updatedTasks = tasks.map((task) => (task.id === taskId ? response.data! : task))
        setTasks(updatedTasks)
        setSelectedTask(response.data)
      }
    } catch (error) {
      console.error("Failed to update task:", error)
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
            tasks={tasks}
            moveTask={moveTask}
            setIsModalNewTaskOpen={setIsModalNewTaskOpen}
            onTaskClick={handleTaskClick}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        ))}
      </div>

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


