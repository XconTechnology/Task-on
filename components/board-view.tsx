"use client"

import { useEffect, useState } from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { useAppStore } from "@/lib/store"
import { taskApi } from "@/lib/api"
import { type Task, Status } from "@/lib/types"
import { EllipsisVertical, MessageSquareMore, Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import TaskDetailModal from "./task-detail-modal"

type BoardProps = {
  projectId: string
  setIsModalNewTaskOpen: (isOpen: boolean) => void
}

const taskStatus = [Status.ToDo, Status.WorkInProgress, Status.UnderReview, Status.Completed]

const statusConfig = {
  [Status.ToDo]: {
    color: "#3B82F6",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    label: "To Do",
  },
  [Status.WorkInProgress]: {
    color: "#10B981",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    label: "Work In Progress",
  },
  [Status.UnderReview]: {
    color: "#F59E0B",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    label: "Under Review",
  },
  [Status.Completed]: {
    color: "#6B7280",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-300",
    label: "Completed",
  },
}

export default function BoardView({ projectId, setIsModalNewTaskOpen }: BoardProps) {
  const { tasks, setTasks, updateTaskStatus, isLoading, setLoading, setError } = useAppStore()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)

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

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await taskApi.updateTask(taskId, updates)
      if (response.success && response.data) {
        // Update the task in the store
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
      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 xl:grid-cols-4 bg-gray-50 min-h-screen custom-scrollbar">
        {taskStatus.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasks}
            moveTask={moveTask}
            setIsModalNewTaskOpen={setIsModalNewTaskOpen}
            onTaskClick={handleTaskClick}
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
    </DndProvider>
  )
}

type TaskColumnProps = {
  status: Status
  tasks: Task[]
  moveTask: (taskId: string, toStatus: Status) => void
  setIsModalNewTaskOpen: (isOpen: boolean) => void
  onTaskClick: (task: Task) => void
}

function TaskColumn({ status, tasks, moveTask, setIsModalNewTaskOpen, onTaskClick }: TaskColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "task",
    drop: (item: { id: string }) => moveTask(item.id, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))

  const columnTasks = tasks.filter((task) => task.status === status)
  const config = statusConfig[status]

  return (
    <div
      ref={drop}
      className={`rounded-lg transition-all duration-200 ${
        isOver ? `${config.bgColor} ${config.borderColor} border-2 border-dashed` : "border-2 border-transparent"
      }`}
    >
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-1 h-12 rounded-l-lg" style={{ backgroundColor: config.color }} />
          <div className="flex-1 flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <h3 className="header-extra-small">{config.label}</h3>
              <span className="inline-flex items-center justify-center w-6 h-6 text-small font-medium text-gray-600 bg-gray-100 rounded-full">
                {columnTasks.length}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="p-1 h-8 w-8 text-gray-400">
                <EllipsisVertical size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8 bg-gray-100 hover:bg-gray-200 text-gray-600"
                onClick={() => setIsModalNewTaskOpen(true)}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3 min-h-[400px] custom-scrollbar overflow-y-auto">
        {columnTasks.map((task) => (
          <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
        ))}

        {columnTasks.length === 0 && (
          <div className="text-center py-8">
            <div className="text-muted">No tasks</div>
          </div>
        )}
      </div>
    </div>
  )
}

type TaskCardProps = {
  task: Task
  onTaskClick: (task: Task) => void
}

function TaskCard({ task, onTaskClick }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "task",
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  const taskTags = task.tags ? task.tags.split(",").map((tag) => tag.trim()) : []
  const numberOfComments = task.comments?.length || 0

  const priorityConfig = {
    Urgent: "bg-red-100 text-red-700 border-red-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Low: "bg-green-100 text-green-700 border-green-200",
    Backlog: "bg-gray-100 text-gray-700 border-gray-200",
  }

  return (
    <Card
      ref={drag}
      onClick={() => onTaskClick(task)}
      className={`task-card transition-all duration-200 hover:shadow-lg bg-white border border-gray-200 ${
        isDragging ? "dragging opacity-50 rotate-1 scale-105 shadow-xl" : "opacity-100"
      }`}
    >
      <CardContent className="p-0">
        {/* Task Image - only show if task has attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="relative">
            <img
              src="/placeholder.svg?height=120&width=280"
              alt="Task attachment"
              className="w-full h-24 object-cover rounded-t-lg"
            />
          </div>
        )}

        <div className={`${task.attachments && task.attachments.length > 0 ? "p-4" : "p-4 pt-4"}`}>
          {/* Priority and Tags */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {task.priority && (
                <Badge variant="outline" className={`text-small ${priorityConfig[task.priority]}`}>
                  {task.priority}
                </Badge>
              )}
              {taskTags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-small bg-blue-100 text-blue-700">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6 text-gray-400"
              onClick={(e) => {
                e.stopPropagation()
                // Handle menu click
              }}
            >
              <EllipsisVertical size={14} />
            </Button>
          </div>

          {/* Task Title */}
          <h4 className="text-medium font-semibold mb-2 line-clamp-2">{task.title}</h4>

          {/* Task Description */}
          {task.description && <p className="text-description mb-3 line-clamp-2">{task.description}</p>}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              {/* Assignee and Author */}
              <div className="flex -space-x-1">
                {task.assignee && (
                  <Avatar className="h-6 w-6 border-2 border-white">
                    <AvatarImage src={task.assignee.profilePictureUrl || "/placeholder.svg"} />
                    <AvatarFallback className="text-small bg-blue-100 text-blue-700">
                      {task.assignee.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {task.author && task.author.id !== task.assignee?.id && (
                  <Avatar className="h-6 w-6 border-2 border-white">
                    <AvatarImage src={task.author.profilePictureUrl || "/placeholder.svg"} />
                    <AvatarFallback className="text-small bg-gray-100 text-gray-700">
                      {task.author.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 text-gray-500">
              {/* Comments */}
              {numberOfComments > 0 && (
                <div className="flex items-center space-x-1">
                  <MessageSquareMore size={14} />
                  <span className="text-small">{numberOfComments}</span>
                </div>
              )}

              {/* Points */}
              {task.points && <div className="text-small font-medium">{task.points}</div>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
