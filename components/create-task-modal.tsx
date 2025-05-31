"use client"

import type React from "react"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { taskApi } from "@/lib/api"
import { Status, Priority, type Task } from "@/lib/types"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type CreateTaskModalProps = {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

export default function CreateTaskModal({ isOpen, onClose, projectId }: CreateTaskModalProps) {
  const { addTask, users } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: Status.ToDo,
    priority: Priority.Backlog,
    tags: "",
    startDate: "",
    dueDate: "",
    authorUserId: "user_1", // Default to first user
    assignedUserId: "unassigned", // Default to unassigned
    points: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setIsLoading(true)
    try {
      const newTask: Partial<Task> = {
        ...formData,
        projectId,
        points: formData.points || undefined,
        assignedUserId: formData.assignedUserId || undefined,
      }

      const response = await taskApi.createTask(newTask)
      if (response.success && response.data) {
        addTask(response.data)
        onClose()
        // Reset form
        setFormData({
          title: "",
          description: "",
          status: Status.ToDo,
          priority: Priority.Backlog,
          tags: "",
          startDate: "",
          dueDate: "",
          authorUserId: "user_1",
          assignedUserId: "unassigned",
          points: 0,
        })
      }
    } catch (error) {
      console.error("Failed to create task:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle>
            <div className="header-small">Create New Task</div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-label">
              Title
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter task title..."
              className="w-full"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-label">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter task description..."
              rows={3}
              className="w-full resize-none"
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-label">Status</label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Status.ToDo}>To Do</SelectItem>
                  <SelectItem value={Status.WorkInProgress}>Work In Progress</SelectItem>
                  <SelectItem value={Status.UnderReview}>Under Review</SelectItem>
                  <SelectItem value={Status.Completed}>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-label">Priority</label>
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

          {/* Tags */}
          <div className="space-y-2">
            <label htmlFor="tags" className="text-label">
              Tags (comma separated)
            </label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange("tags", e.target.value)}
              placeholder="e.g. frontend, urgent, bug"
              className="w-full"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-label">
                Start Date
              </label>
              <div className="relative">
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className="w-full"
                />
                <Calendar
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="dueDate" className="text-label">
                Due Date
              </label>
              <div className="relative">
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange("dueDate", e.target.value)}
                  className="w-full"
                />
                <Calendar
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>
          </div>

          {/* Author and Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-label">Author User ID</label>
              <Select value={formData.authorUserId} onValueChange={(value) => handleInputChange("authorUserId", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-label">Assigned User ID</label>
              <Select
                value={formData.assignedUserId}
                onValueChange={(value) => handleInputChange("assignedUserId", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select assignee..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Points */}
          <div className="space-y-2">
            <label htmlFor="points" className="text-label">
              Story Points
            </label>
            <Input
              id="points"
              type="number"
              value={formData.points}
              onChange={(e) => handleInputChange("points", Number.parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              <span className="text-medium">Cancel</span>
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <span className="text-medium text-white">{isLoading ? "Creating..." : "Create Task"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
