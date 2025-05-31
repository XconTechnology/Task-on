"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { taskApi } from "@/lib/api"
import { Status, Priority, type Task } from "@/lib/types"
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Circle,
  Play,
  Pause,
  CheckCircle,
  Calendar,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import StatusDropdown from "./status-dropdown"
import { format } from "date-fns"

type ListViewProps = {
  projectId: string
  setIsModalNewTaskOpen: (isOpen: boolean) => void
}

const statusConfig = {
  [Status.Completed]: {
    label: "COMPLETE",
    icon: CheckCircle,
    color: "bg-green-600",
    textColor: "text-white",
    count: 0,
  },
  [Status.WorkInProgress]: {
    label: "IN PROGRESS",
    icon: Play,
    color: "bg-blue-600",
    textColor: "text-white",
    count: 0,
  },
  [Status.ToDo]: {
    label: "TO DO",
    icon: Circle,
    color: "bg-gray-600",
    textColor: "text-white",
    count: 0,
  },
  [Status.UnderReview]: {
    label: "UNDER REVIEW",
    icon: Pause,
    color: "bg-orange-600",
    textColor: "text-white",
    count: 0,
  },
}

const priorityConfig = {
  [Priority.Urgent]: { color: "bg-red-100 text-red-700", label: "Urgent" },
  [Priority.High]: { color: "bg-orange-100 text-orange-700", label: "High" },
  [Priority.Medium]: { color: "bg-yellow-100 text-yellow-700", label: "Medium" },
  [Priority.Low]: { color: "bg-green-100 text-green-700", label: "Low" },
  [Priority.Backlog]: { color: "bg-gray-100 text-gray-700", label: "Backlog" },
}

export default function ListView({ projectId, setIsModalNewTaskOpen }: ListViewProps) {
  const { tasks, setTasks, updateTaskStatus, isLoading, setLoading, setError } = useAppStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [collapsedSections, setCollapsedSections] = useState<Set<Status>>(new Set())

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

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Group tasks by status and only show sections that have tasks
  const tasksByStatus = filteredTasks.reduce(
    (acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = []
      }
      acc[task.status].push(task)
      return acc
    },
    {} as Record<Status, Task[]>,
  )

  const toggleSection = (status: Status) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(status)) {
      newCollapsed.delete(status)
    } else {
      newCollapsed.add(status)
    }
    setCollapsedSections(newCollapsed)
  }

  const handleStatusChange = async (taskId: string, newStatus: Status) => {
    updateTaskStatus(taskId, newStatus)
    try {
      await taskApi.updateTaskStatus(taskId, newStatus)
    } catch (error) {
      console.error("Failed to update task status:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Order statuses to match ClickUp: Complete, In Progress, To Do, Under Review
  const statusOrder = [Status.Completed, Status.WorkInProgress, Status.ToDo, Status.UnderReview]
  const visibleStatuses = statusOrder.filter((status) => tasksByStatus[status]?.length > 0)

  return (
    <div className="bg-white min-h-screen">
      {/* Header with search */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-label">Group: Status</h2>
            <div className="flex items-center space-x-2">
              <span className="text-muted">Subtasks</span>
              <span className="text-muted">Columns</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <Button
              onClick={() => setIsModalNewTaskOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <span className="text-medium text-white">Add Task</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Task Lists */}
      <div className="p-6 space-y-6">
        {visibleStatuses.map((status) => {
          const config = statusConfig[status]
          const statusTasks = tasksByStatus[status] || []
          const isCollapsed = collapsedSections.has(status)
          const Icon = config.icon

          return (
            <div key={status} className="space-y-3">
              {/* Status Header */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection(status)}
                  className="p-0 h-auto hover:bg-transparent"
                >
                  {isCollapsed ? (
                    <ChevronRight className="text-gray-400" size={16} />
                  ) : (
                    <ChevronDown className="text-gray-400" size={16} />
                  )}
                </Button>

                <div className={`flex items-center space-x-2 px-3 py-1 rounded-md ${config.color}`}>
                  <Icon className={config.textColor} size={16} />
                  <span className={`text-medium font-medium ${config.textColor}`}>{config.label}</span>
                  <span className={`text-medium ${config.textColor}`}>{statusTasks.length}</span>
                </div>

                <Button variant="ghost" size="sm" className="p-1 h-auto text-gray-400 hover:text-gray-600">
                  <MoreHorizontal size={16} />
                </Button>

                <Button
                  onClick={() => setIsModalNewTaskOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto text-gray-400 hover:text-gray-600"
                >
                  <Plus size={16} />
                </Button>
              </div>

              {/* Tasks Table */}
              {!isCollapsed && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="col-span-4 text-label">Name</div>
                    <div className="col-span-2 text-label">Assignee</div>
                    <div className="col-span-2 text-label">Due date</div>
                    <div className="col-span-1 text-label">Priority</div>
                    <div className="col-span-2 text-label">Status</div>
                    <div className="col-span-1 text-label">Comments</div>
                  </div>

                  {/* Task Rows */}
                  <div className="divide-y divide-gray-100">
                    {statusTasks.map((task) => (
                      <div key={task.id} className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 items-center">
                        {/* Name */}
                        <div className="col-span-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                status === Status.Completed
                                  ? "bg-green-500"
                                  : status === Status.WorkInProgress
                                    ? "bg-blue-500"
                                    : status === Status.UnderReview
                                      ? "bg-orange-500"
                                      : "bg-gray-400"
                              }`}
                            />
                            <span className="text-medium font-medium">{task.title}</span>
                          </div>
                        </div>

                        {/* Assignee */}
                        <div className="col-span-2">
                          {task.assignee ? (
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={task.assignee.profilePictureUrl || "/placeholder.svg"} />
                                <AvatarFallback className="text-small">
                                  {task.assignee.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-medium">{task.assignee.username}</span>
                            </div>
                          ) : (
                            <span className="text-muted">Unassigned</span>
                          )}
                        </div>

                        {/* Due Date */}
                        <div className="col-span-2">
                          {task.dueDate ? (
                            <div className="flex items-center space-x-1">
                              <Calendar size={14} />
                              <span className="text-medium">{format(new Date(task.dueDate), "MMM dd")}</span>
                            </div>
                          ) : (
                            <span className="text-muted">No due date</span>
                          )}
                        </div>

                        {/* Priority */}
                        <div className="col-span-1">
                          {task.priority && (
                            <Badge className={priorityConfig[task.priority].color}>
                              <span className="text-small">{priorityConfig[task.priority].label}</span>
                            </Badge>
                          )}
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <StatusDropdown
                            currentStatus={task.status}
                            onStatusChange={(newStatus) => handleStatusChange(task.id, newStatus)}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className={`${
                                status === Status.Completed
                                  ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                                  : status === Status.WorkInProgress
                                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                    : status === Status.UnderReview
                                      ? "bg-orange-600 text-white border-orange-600 hover:bg-orange-700"
                                      : "bg-gray-600 text-white border-gray-600 hover:bg-gray-700"
                              }`}
                            >
                              <span className="text-small text-white">{statusConfig[status].label}</span>
                            </Button>
                          </StatusDropdown>
                        </div>

                        {/* Comments */}
                        <div className="col-span-1">
                          <div className="flex items-center space-x-1 text-gray-500">
                            <MessageSquare size={14} />
                            <span className="text-medium">{task.comments?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add Task Row */}
                    <div className="px-4 py-2">
                      <Button
                        onClick={() => setIsModalNewTaskOpen(true)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Plus size={16} className="mr-2" />
                        <span className="text-medium">Add Task</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {visibleStatuses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto mb-4" />
              <h3 className="header-small mb-2">No tasks found</h3>
              <p className="text-description">Create your first task to get started.</p>
            </div>
            <Button onClick={() => setIsModalNewTaskOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus size={16} className="mr-2" />
              <span className="text-medium text-white">Create Task</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
