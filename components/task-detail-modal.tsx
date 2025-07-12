"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { type Task, Status, Priority } from "@/lib/types"
import {
  X,
  Calendar,
  User,
  Flag,
  Clock,
  Activity,
  MoreHorizontal,
  Star,
  Play,
  Square,
  Edit3,
  Check,
  ChevronDown,
  Tag,
  Paperclip,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StatusDropdown from "./status-dropdown"
import { format } from "date-fns"
import TaskComments from "./tasks/task-comments"
import TaskAttachments from "./tasks/task-attachments"
import { useUser } from "@/lib/user-context"
import { useTimeTracking } from "@/lib/contexts/time-tracking-context"
import { timeTrackingApi, workspaceApi } from "@/lib/api"
import { formatDuration } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getCategoriesForPosition } from "@/lib/constants"

type TaskDetailModalProps = {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void
}

export default function TaskDetailModal({ task, isOpen, onClose, onUpdateTask }: TaskDetailModalProps) {
  const { user, currentWorkspace } = useUser()
  const { activeTimer, elapsedTime, startTimer, stopTimer, isLoading: timerLoading } = useTimeTracking()
  const { toast } = useToast()

  // Editing states
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<any>({})
  const [availableMembers, setAvailableMembers] = useState<any[]>([])

  // Task time tracking
  const [taskTime, setTaskTime] = useState({ totalTime: 0, isRunning: false })
  const [loadingTaskTime, setLoadingTaskTime] = useState(false)

  useEffect(() => {
    if (task && isOpen) {
      fetchTaskTime()
      fetchAvailableMembers()
      setEditedValues({})
      setEditingField(null)
    }
  }, [task, isOpen])

  useEffect(() => {
    if (activeTimer?.taskId === task?.id) {
      setTaskTime((prev) => ({ ...prev, isRunning: true }))
    } else {
      setTaskTime((prev) => ({ ...prev, isRunning: false }))
    }
  }, [activeTimer, task?.id])

  const fetchTaskTime = async () => {
    if (!task) return
    setLoadingTaskTime(true)
    try {
      const response = await timeTrackingApi.getTaskTime(task.id)
      if (response.success && response.data) {
        setTaskTime(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch task time:", error)
    } finally {
      setLoadingTaskTime(false)
    }
  }

  const fetchAvailableMembers = async () => {
    try {
      const response = await workspaceApi.getMembers()
      if (response.success && response.data) {
        setAvailableMembers(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
    }
  }

  const handleStartTimer = async () => {
    if (!task) return
    try {
      await startTimer(task.id)
      await fetchTaskTime()
    } catch (error) {
      console.error("Failed to start timer:", error)
    }
  }

  const handleStopTimer = async () => {
    if (!activeTimer) return
    try {
      await stopTimer()
      await fetchTaskTime()
    } catch (error) {
      console.error("Failed to stop timer:", error)
    }
  }

  const startEditing = (field: string, currentValue?: any) => {
    setEditingField(field)
    setEditedValues({ ...editedValues, [field]: currentValue })
  }

  const cancelEditing = () => {
    setEditingField(null)
    setEditedValues({})
  }

  const saveField = async (field: string) => {
    if (!task || !onUpdateTask) return
    try {
      const updateData = { [field]: editedValues[field] }
      await onUpdateTask(task.id, updateData)
      toast({
        title: "Task Updated",
        description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been updated successfully.`,
      })
      setEditingField(null)
      setEditedValues({})
    } catch (error) {
      console.error("Failed to update task:", error)
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update task. Please try again.",
      })
    }
  }

  if (!task) return null

  const statusConfig = {
    [Status.ToDo]: {
      label: "TO DO",
      color: "bg-gray-100 text-gray-700",
      dotColor: "bg-gray-400",
    },
    [Status.WorkInProgress]: {
      label: "IN PROGRESS",
      color: "bg-blue-100 text-blue-700",
      dotColor: "bg-blue-500",
    },
    [Status.UnderReview]: {
      label: "UNDER REVIEW",
      color: "bg-orange-100 text-orange-700",
      dotColor: "bg-orange-500",
    },
    [Status.Completed]: {
      label: "COMPLETE",
      color: "bg-green-100 text-green-700",
      dotColor: "bg-green-500",
    },
  }

  const priorityConfig = {
    [Priority.Urgent]: {
      label: "Urgent",
      color: "bg-red-100 text-red-700",
      dotColor: "bg-red-500",
    },
    [Priority.High]: {
      label: "High",
      color: "bg-orange-100 text-orange-700",
      dotColor: "bg-orange-500",
    },
    [Priority.Medium]: {
      label: "Medium",
      color: "bg-yellow-100 text-yellow-700",
      dotColor: "bg-yellow-500",
    },
    [Priority.Low]: {
      label: "Low",
      color: "bg-green-100 text-green-700",
      dotColor: "bg-green-500",
    },
    [Priority.Backlog]: {
      label: "Backlog",
      color: "bg-gray-100 text-gray-700",
      dotColor: "bg-gray-400",
    },
  }

  const isTimerActive = activeTimer?.taskId === task.id

  // Get current user's position to determine available categories
  const currentUserMember = availableMembers.find((member) => member.memberId === user?.id)
  const userPosition = currentUserMember?.position
  const availableCategories = userPosition ? getCategoriesForPosition(userPosition) : []

  // Check if user can upload attachments (assignee or admin)
  const canUploadAttachments =
    task.assignedTo === user?.id || currentUserMember?.role === "Admin" || currentUserMember?.role === "Owner"

  // Editable Field Component (same as before)
  const EditableField = ({
    field,
    value,
    displayValue,
    type = "text",
    placeholder = "Empty",
    children,
  }: {
    field: string
    value: any
    displayValue?: string
    type?: "text" | "textarea" | "select" | "date" | "member"
    placeholder?: string
    children?: React.ReactNode
  }) => {
    const isEditing = editingField === field
    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          {type === "text" && (
            <Input
              value={editedValues[field] || value || ""}
              onChange={(e) => setEditedValues({ ...editedValues, [field]: e.target.value })}
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveField(field)
                if (e.key === "Escape") cancelEditing()
              }}
            />
          )}
          {type === "textarea" && (
            <Textarea
              value={editedValues[field] || value || ""}
              onChange={(e) => setEditedValues({ ...editedValues, [field]: e.target.value })}
              className="flex-1"
              autoFocus
              rows={3}
            />
          )}
          {type === "date" && (
            <Input
              type="date"
              value={editedValues[field] || value || ""}
              onChange={(e) => setEditedValues({ ...editedValues, [field]: e.target.value })}
              className="flex-1 text-xs"
              autoFocus
            />
          )}
          <Button size="sm" onClick={() => saveField(field)} className="h-8 w-8 p-0">
            <Check size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-8 w-8 p-0">
            <X size={14} />
          </Button>
        </div>
      )
    }

    return (
      <div
        className="group flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1"
        onClick={() => startEditing(field, value)}
      >
        <div className="flex-1">
          {children || (
            <span className={value ? "text-medium" : "text-muted italic"}>{displayValue || value || placeholder}</span>
          )}
        </div>
        <Edit3 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[87vh] p-0 bg-white overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Task Details: {task.title}</DialogTitle>
        </DialogHeader>
        <div className="flex h-full">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-muted">Task</span>
                  <Badge variant="outline" className="text-small">
                    {task.id.split("_")[1]}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm">
                  <Star size={16} />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
              
                <Button variant="ghost" size="sm">
                  <MoreHorizontal size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X size={16} />
                </Button>
              </div>
            </div>
            {/* Task Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 ">
              {/* Title */}
              <div className="mb-9 pt-7">
                <EditableField field="title" value={task.title} type="text">
                  <h1 className="header-medium mb-2">{task.title}</h1>
                </EditableField>
              </div>
              {/* Properties Grid */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Status */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 w-28">
                    <Flag size={16} className="text-gray-400" />
                    <span className="text-label">Status</span>
                  </div>
                  <StatusDropdown
                    currentStatus={task.status}
                    onStatusChange={(newStatus) => onUpdateTask?.(task.id, { status: newStatus })}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className={`${statusConfig[task.status].color} hover:bg-opacity-80`}
                    >
                      <div className={`w-2 h-2 rounded-full ${statusConfig[task.status].dotColor} mr-2`} />
                      <span className="text-small">{statusConfig[task.status].label}</span>
                      <ChevronDown size={14} className="ml-1" />
                    </Button>
                  </StatusDropdown>
                </div>
                {/* Assignee */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 w-28">
                    <User size={16} className="text-gray-400" />
                    <span className="text-label">Assignees</span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="h-auto p-2 justify-start hover:bg-gray-50">
                        {task.assignee ? (
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={task.assignee.profilePictureUrl || "/placeholder.svg" || "/placeholder.svg"}
                              />
                              <AvatarFallback className="text-small">
                                {task.assignee.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-medium">{task.assignee.username}</span>
                            <ChevronDown size={14} className="text-gray-400" />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400 ">Empty</span>
                            <ChevronDown size={14} className="text-gray-400" />
                          </div>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <div className="p-3 border-b">
                        <h4 className="font-medium">Assign to member</h4>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        <div className="p-1">
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto p-2"
                            onClick={() => onUpdateTask?.(task.id, { assignedTo: undefined })}
                          >
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 mr-2" />
                            <span className="text-gray-400">Unassigned</span>
                          </Button>
                          {availableMembers.map((member) => (
                            <Button
                              key={member.memberId}
                              variant="ghost"
                              className="w-full justify-start h-auto p-2"
                              onClick={() =>
                                onUpdateTask?.(task.id, {
                                  assignedTo: member.memberId,
                                })
                              }
                            >
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage
                                  src={member.profilePictureUrl || "/placeholder.svg" || "/placeholder.svg"}
                                />
                                <AvatarFallback className="text-small">
                                  {member.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-left">
                                <div className="text-sm font-medium">{member.username}</div>
                                <div className="text-xs text-gray-500">{member.email}</div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Track Time */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 w-28">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-label">Track Time</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {loadingTaskTime ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    ) : (
                      <>
                        {isTimerActive ? (
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={handleStopTimer}
                              disabled={timerLoading}
                              variant="ghost"
                              size="sm"
                              className="w-6 h-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Square size={12} />
                            </Button>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              <span className="text-sm font-mono font-semibold text-red-600">
                                {formatDuration(
                                  taskTime.isRunning ? taskTime.totalTime + elapsedTime : taskTime.totalTime,
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={handleStartTimer}
                              disabled={timerLoading}
                              variant="ghost"
                              size="sm"
                              className="w-6 h-6 p-0 text-green-500 hover:text-green-600 hover:bg-green-50"
                            >
                              <Play size={12} />
                            </Button>
                            {taskTime.totalTime > 0 ? (
                              <span className="text-sm text-gray-600">{formatDuration(taskTime.totalTime)}</span>
                            ) : (
                              <span className="text-sm text-gray-600">0 min</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {/* Due Date */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 w-28">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-label">Due Date</span>
                  </div>
                  <EditableField
                    field="dueDate"
                    value={task.dueDate}
                    displayValue={task.dueDate ? format(new Date(task.dueDate), "MMM dd, yyyy") : undefined}
                    type="date"
                    placeholder="Set due date"
                  />
                </div>
                {/* Priority */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 w-28">
                    <Flag size={16} className="text-gray-400" />
                    <span className="text-label">Priority</span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="h-auto p-2 justify-start hover:bg-gray-50">
                        {task.priority ? (
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${priorityConfig[task.priority].dotColor}`} />
                            <Badge className={priorityConfig[task.priority].color}>
                              <span className="text-small">{priorityConfig[task.priority].label}</span>
                            </Badge>
                            <ChevronDown size={14} className="text-gray-400" />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-muted">Empty</span>
                            <ChevronDown size={14} className="text-gray-400" />
                          </div>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1" align="start">
                      {Object.entries(priorityConfig).map(([priority, config]) => (
                        <Button
                          key={priority}
                          variant="ghost"
                          className="w-full justify-start h-auto p-2"
                          onClick={() =>
                            onUpdateTask?.(task.id, {
                              priority: priority as Priority,
                            })
                          }
                        >
                          <div className={`w-2 h-2 rounded-full ${config.dotColor} mr-2`} />
                          <span className="text-sm">{config.label}</span>
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-auto p-2"
                        onClick={() => onUpdateTask?.(task.id, { priority: undefined })}
                      >
                        <div className="w-2 h-2 rounded-full border border-gray-300 mr-2" />
                        <span className="text-sm text-muted">No Priority</span>
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Start Date */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 w-28">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-label">Start Date</span>
                  </div>
                  <EditableField
                    field="startDate"
                    value={task.startDate}
                    displayValue={task.startDate ? format(new Date(task.startDate), "MMM dd, yyyy") : undefined}
                    type="date"
                    placeholder="Set start date"
                  />
                </div>
                {/* Category */}
                {userPosition && availableCategories.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 w-28">
                      <Tag size={16} className="text-gray-400" />
                      <span className="text-label">Category</span>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-auto p-2 justify-start hover:bg-gray-50">
                          {task.category ? (
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                <span className="text-small">{task.category}</span>
                              </Badge>
                              <ChevronDown size={14} className="text-gray-400" />
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-muted">Select category</span>
                              <ChevronDown size={14} className="text-gray-400" />
                            </div>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-1" align="start">
                        <div className="p-2 border-b">
                          <h4 className="font-medium text-sm">Categories for {userPosition}</h4>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {availableCategories.map((category) => (
                            <Button
                              key={category}
                              variant="ghost"
                              className="w-full justify-start h-auto p-2"
                              onClick={() => onUpdateTask?.(task.id, { category })}
                            >
                              <Tag size={14} className="mr-2 text-purple-600" />
                              <span className="text-sm">{category}</span>
                            </Button>
                          ))}
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto p-2"
                            onClick={() => onUpdateTask?.(task.id, { category: undefined })}
                          >
                            <div className="w-3.5 h-3.5 rounded border border-gray-300 mr-2" />
                            <span className="text-sm text-muted">No Category</span>
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              {/* Description */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-label">Description</h3>
                </div>
                <EditableField
                  field="description"
                  value={task.description}
                  type="textarea"
                  placeholder="Add description..."
                >
                  <div className="text-medium text-gray-700 whitespace-pre-wrap">
                    {task.description || <span className="text-gray-400 italic">Add description...</span>}
                  </div>
                </EditableField>
              </div>
            </div>
          </div>
          {/* Activity Sidebar with Tabs */}
          <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-label">Activity & Files</h3>
                <Button variant="ghost" size="sm">
                  <Activity size={16} />
                </Button>
              </div>
            </div>

            {/* Tabs for Comments and Attachments */}
            <Tabs defaultValue="comments" className="flex-1 flex flex-col">
              <div className="px-4 py-2 border-b border-gray-200">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="comments" className="flex items-center space-x-2">
                    <Activity size={14} />
                    <span>Comments</span>
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="flex items-center space-x-2">
                    <Paperclip size={14} />
                    <span>Attachments</span>
                    {(task.attachmentCount && task.attachmentCount > 0 ) ? (
                      <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 text-xs">
                        {task.attachmentCount}
                      </Badge>
                    ): (
                      <></>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="comments" className="flex-1 m-0">
                {user && currentWorkspace && (
                  <TaskComments taskId={task.id} workspaceId={task.workspaceId || currentWorkspace.id} />
                )}
              </TabsContent>

              <TabsContent value="attachments" className="flex-1 m-0 p-4">
                {user && currentWorkspace && (
                  <TaskAttachments
                    taskId={task.id}
                    workspaceId={task.workspaceId || currentWorkspace.id}
                    canUpload={canUploadAttachments}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
