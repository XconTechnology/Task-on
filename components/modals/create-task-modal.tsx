"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Priority, Status } from "@/lib/types"
import { taskApi, workspaceApi } from "@/lib/api"
import { successToast, errorToast } from "@/lib/toast-utils"
import { useUser } from "@/lib/user-context"
import { useTasks } from "@/lib/contexts/task-context"

type CreateTaskModalProps = {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onTaskCreated?: (task: any) => void
}

export default function CreateTaskModal({ isOpen, onClose, projectId, onTaskCreated }: CreateTaskModalProps) {
  const { user } = useUser() // Get current user
  const { addTask } = useTasks() // Get addTask from context
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [availableMembers, setAvailableMembers] = useState<any[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]) // Changed to array for multiple selection
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "To Do" as Status,
    priority: "Medium" as Priority,
    dueDate: "",
  })

  useEffect(() => {
    if (isOpen) {
      fetchAvailableMembers()
      // Reset form when modal opens
      setFormData({
        title: "",
        description: "",
        status: "To Do" as Status,
        priority: "Medium" as Priority,
        dueDate: "",
      })
      setSelectedMembers([])
    }
  }, [isOpen])

  const fetchAvailableMembers = async () => {
    setIsLoadingMembers(true)
    try {
      const response = await workspaceApi.getMembers()
      if (response.success && response.data) {
        setAvailableMembers(response.data)
      } else {
        console.error("Failed to fetch members:", response.error)
        setAvailableMembers([])
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
      setAvailableMembers([])
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    if (!user?.id) {
      errorToast({
        title: "Authentication Error",
        description: "User not found. Please sign in again.",
      })
      return
    }

    setIsLoading(true)
    try {
      // For single assignment, take the first selected member
      const assignedTo = selectedMembers.length > 0 ? selectedMembers[0] : undefined

      const response = await taskApi.createTask({
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        projectId,
        assignedTo, // This will be a single user ID or undefined
        dueDate: formData.dueDate || undefined,
        // createdBy is automatically set in the API from the authenticated user
      })

      if (response.success && response.data) {
        // Add the new task to our context for real-time updates
        addTask(response.data)

        successToast({
          title: "Task Created",
          description: "The task has been successfully created.",
        })

        onTaskCreated?.(response.data)
        handleClose()
      } else {
        errorToast({
          title: "Task Creation Failed",
          description: response.error || "Failed to create task. Please try again.",
        })
        console.error("Failed to create task:", response.error)
      }
    } catch (error) {
      console.error("Failed to create task:", error)
      errorToast({
        title: "Task Creation Failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      status: "To Do" as Status,
      priority: "Medium" as Priority,
      dueDate: "",
    })
    setSelectedMembers([])
    onClose()
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }


  const removeMember = (memberId: string) => {
    setSelectedMembers((prev) => prev.filter((id) => id !== memberId))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">Create New Task</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="p-1 h-8 w-8">
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-900">
              Title
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter task title..."
              className="w-full"
              disabled={isLoading}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-900">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter task description..."
              rows={3}
              className="w-full resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Status</label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Status.ToDo}>To Do</SelectItem>
                  <SelectItem value={Status.WorkInProgress}>In Progress</SelectItem>
                  <SelectItem value={Status.UnderReview}>Under Review</SelectItem>
                  <SelectItem value={Status.Completed}>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Priority</label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Priority.Urgent}>Urgent</SelectItem>
                  <SelectItem value={Priority.High}>High</SelectItem>
                  <SelectItem value={Priority.Medium}>Medium</SelectItem>
                  <SelectItem value={Priority.Low}>Low</SelectItem>
                  <SelectItem value={Priority.Backlog}>Backlog</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label htmlFor="dueDate" className="text-sm font-medium text-gray-900">
              Due Date (Optional)
            </label>
            <div className="relative">
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
                className="w-full"
                disabled={isLoading}
              />
              <Calendar
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
            </div>
          </div>

          {/* Created By - Display only, not selectable */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Created By</label>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profilePictureUrl || "/placeholder.svg"} />
                <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.username || "Current User"}</p>
                <p className="text-xs text-gray-600">{user?.email || ""}</p>
              </div>
            </div>
          </div>

          {/* Assign To Member */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900">Assign To Member (Optional)</label>
              <Badge variant="secondary" className="text-xs">
                {selectedMembers.length} selected
              </Badge>
            </div>

            {isLoadingMembers ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                {availableMembers.length > 0 ? (
                  availableMembers.map((member: any) => (
                    <div
                      key={member.memberId}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        selectedMembers.includes(member.memberId)
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedMembers.includes(member.memberId)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMembers([member.memberId]) // For single assignment
                          } else {
                            setSelectedMembers([])
                          }
                        }}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profilePictureUrl || "/placeholder.svg"} />
                        <AvatarFallback>{member.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{member.username}</p>
                        <p className="text-xs text-gray-600">{member.email}</p>
                      </div>
                      {member.role && (
                        <Badge
                          variant="secondary"
                          className={
                            member.role === "Owner"
                              ? "bg-yellow-100 text-yellow-700"
                              : member.role === "Admin"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }
                        >
                          {member.role}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-sm text-gray-500">No members available</p>
                  </div>
                )}
              </div>
            )}

            {/* Selected Members Display */}
            {selectedMembers.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 mb-2">Selected member will be assigned to this task:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((memberId) => {
                    const member = availableMembers.find((m) => m.memberId === memberId)
                    if (!member) return null

                    return (
                      <div
                        key={memberId}
                        className="flex items-center space-x-2 bg-white border border-blue-200 rounded-full px-3 py-1"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.profilePictureUrl || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {member.username?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-900">{member.username}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="p-0 h-4 w-4 text-gray-400 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeMember(memberId)
                          }}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Creating...</span>
                </div>
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
