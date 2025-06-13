"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Task } from "@/lib/types"
import { taskApi } from "@/lib/api"

interface TaskContextType {
  tasks: Task[]
  isLoading: boolean
  error: Error | null
  refreshTasks: (projectId?: string) => Promise<void>
  addTask: (task: Task) => void
  updateTask: (taskId: string, updatedTask: Task) => void
  deleteTask: (taskId: string) => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children, projectId }: { children: ReactNode; projectId?: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTasks = async (pid?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await taskApi.getTasks(pid || projectId)
      if (response.success && response.data) {
        setTasks(response.data)
      } else {
        setError(new Error(response.error || "Failed to fetch tasks"))
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred while fetching tasks"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [projectId])

  const refreshTasks = async (pid?: string) => {
    await fetchTasks(pid)
  }

  const addTask = (task: Task) => {
    setTasks((prevTasks) => [task, ...prevTasks])
  }

  const updateTask = (taskId: string, updatedTask: Task) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, ...updatedTask } : task)))
  }

  const deleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        refreshTasks,
        addTask,
        updateTask,
        deleteTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider")
  }
  return context
}
