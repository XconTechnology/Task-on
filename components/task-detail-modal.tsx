"use client"

import { useState } from "react"
import { type Task, Status, Priority } from "@/lib/types"
import { X, Calendar, User, Flag, Clock, Activity, MoreHorizontal, Star, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import StatusDropdown from "./status-dropdown"
import { format } from "date-fns"

type TaskDetailModalProps = {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void
}

export default function TaskDetailModal({ task, isOpen, onClose, onUpdateTask }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState<Partial<Task>>({})
  const [newComment, setNewComment] = useState("")

  if (!task) return null

  const handleSave = () => {
    if (onUpdateTask) {
      onUpdateTask(task.id, editedTask)
    }
    setIsEditing(false)
    setEditedTask({})
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedTask({})
  }

  const statusConfig = {
    [Status.ToDo]: { label: "TO DO", color: "bg-gray-100 text-gray-700" },
    [Status.WorkInProgress]: { label: "IN PROGRESS", color: "bg-blue-100 text-blue-700" },
    [Status.UnderReview]: { label: "UNDER REVIEW", color: "bg-orange-100 text-orange-700" },
    [Status.Completed]: { label: "COMPLETE", color: "bg-green-100 text-green-700" },
  }

  const priorityConfig = {
    [Priority.Urgent]: { label: "Urgent", color: "bg-red-100 text-red-700" },
    [Priority.High]: { label: "High", color: "bg-orange-100 text-orange-700" },
    [Priority.Medium]: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
    [Priority.Low]: { label: "Low", color: "bg-green-100 text-green-700" },
    [Priority.Backlog]: { label: "Backlog", color: "bg-gray-100 text-gray-700" },
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 bg-white overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Task Details: {task.title}</DialogTitle>
        </DialogHeader>
        <div className="flex h-full">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
                <Button variant="outline" size="sm">
                  <Share size={16} className="mr-2" />
                  <span className="text-small">Share</span>
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X size={16} />
                </Button>
              </div>
            </div>

            {/* Task Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {/* Title */}
              <div className="mb-6">
                {isEditing ? (
                  <Input
                    value={editedTask.title || task.title}
                    onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                    className="text-2xl font-bold border-none p-0 focus:ring-0"
                  />
                ) : (
                  <h1 className="header-medium mb-2">{task.title}</h1>
                )}
              </div>

              {/* Properties Grid */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Status */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 w-24">
                    <Flag size={16} className="text-gray-400" />
                    <span className="text-label">Status</span>
                  </div>
                  <StatusDropdown
                    currentStatus={task.status}
                    onStatusChange={(newStatus) => onUpdateTask?.(task.id, { status: newStatus })}
                  >
                    <Button variant="outline" size="sm" className={statusConfig[task.status].color}>
                      <span className="text-small">{statusConfig[task.status].label}</span>
                    </Button>
                  </StatusDropdown>
                </div>

                {/* Assignee */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 w-24">
                    <User size={16} className="text-gray-400" />
                    <span className="text-label">Assignees</span>
                  </div>
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
                    <span className="text-muted">Empty</span>
                  )}
                </div>

                {/* Dates */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 w-24">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-label">Dates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {task.startDate && (
                      <span className="text-medium">Start: {format(new Date(task.startDate), "MMM dd, yyyy")}</span>
                    )}
                    {task.dueDate && (
                      <span className="text-medium">Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}</span>
                    )}
                    {!task.startDate && !task.dueDate && <span className="text-muted">Empty</span>}
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 w-24">
                    <Flag size={16} className="text-gray-400" />
                    <span className="text-label">Priority</span>
                  </div>
                  {task.priority ? (
                    <Badge className={priorityConfig[task.priority].color}>
                      <span className="text-small">{priorityConfig[task.priority].label}</span>
                    </Badge>
                  ) : (
                    <span className="text-muted">Empty</span>
                  )}
                </div>

                {/* Time Estimate */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 w-24">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-label">Time Estimate</span>
                  </div>
                  <span className="text-muted">Empty</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-label">Description</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    <span className="text-small">{isEditing ? "Cancel" : "Edit"}</span>
                  </Button>
                </div>
                {isEditing ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editedTask.description || task.description || ""}
                      onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                      placeholder="Add description..."
                      rows={4}
                      className="w-full"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                        <span className="text-small text-white">Save</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        <span className="text-small">Cancel</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-medium text-gray-700">
                    {task.description || <span className="text-muted italic">Add description...</span>}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-label mb-4">Comments</h3>
                <div className="space-y-4">
                  {/* Add Comment */}
                  <div className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                        className="w-full"
                      />
                      <div className="flex justify-end mt-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <span className="text-small text-white">Send</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Existing Comments */}
                  {task.comments?.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user?.profilePictureUrl || "/placeholder.svg"} />
                        <AvatarFallback className="text-small">
                          {comment.user?.username.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-medium font-medium">{comment.user?.username || "Unknown"}</span>
                          <span className="text-muted-small">
                            {format(new Date(comment.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <p className="text-medium text-gray-700">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Sidebar */}
          <div className="w-80 border-l border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-label">Activity</h3>
                <Button variant="ghost" size="sm">
                  <Activity size={16} />
                </Button>
              </div>
            </div>
            <div className="p-4 custom-scrollbar overflow-y-auto h-full">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder.svg?height=24&width=24" />
                    <AvatarFallback className="text-extra-small">JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-small">
                      <span className="font-medium">John Doe</span> created this task
                    </p>
                    <p className="text-muted-small">{format(new Date(task.createdAt), "MMM dd, yyyy 'at' h:mm a")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
