"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { targetApi, workspaceApi, projectApi } from "@/lib/api"
import type { Target,  Project, WorkspaceMember } from "@/lib/types"

interface EditTargetModalProps {
  isOpen: boolean
  onClose: () => void
  target: Target | null
  onSuccess: (target: Target) => void
  onDelete: (targetId: string) => void
}

export default function EditTargetModal({ isOpen, onClose, target, onSuccess, onDelete }: EditTargetModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [users, setUsers] = useState<WorkspaceMember[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [date, setDate] = useState<Date>()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    projectId: "",
    targetValue: "",
    currentValue: "",
    unit: "",
    status: "",
  })

  // Initialize form data when target changes
  useEffect(() => {
    if (target && isOpen) {
      setFormData({
        title: target.title,
        description: target.description,
        assignedTo: target.assignedTo,
        projectId: target.projectId || "",
        targetValue: target.targetValue.toString(),
        currentValue: target.currentValue.toString(),
        unit: target.unit,
        status: target.status,
      })
      setDate(new Date(target.deadline))
      fetchUsers()
      fetchProjects()
    }
  }, [target, isOpen])

  const fetchUsers = async () => {
    try {
      const response = await workspaceApi.getMembers()
      if (response.success && response.data) {
        setUsers(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch workspace members:", error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await projectApi.getProjects()
      if (response.success && response.data) {
        setProjects(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!target || !date) return

    setIsLoading(true)
    try {
      const targetData = {
        ...formData,
        targetValue: Number(formData.targetValue),
        currentValue: Number(formData.currentValue),
        deadline: date.toISOString(),
        projectId: formData.projectId || undefined,
      }

      const response = await targetApi.updateTarget(target.id, targetData as any)
      if (response.success && response.data) {
        onSuccess(response.data)
        handleClose()
      }
    } catch (error) {
      console.error("Failed to update target:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!target) return

    setIsDeleting(true)
    try {
      const response = await targetApi.deleteTarget(target.id)
      if (response.success) {
        onDelete(target.id)
        handleClose()
      }
    } catch (error) {
      console.error("Failed to delete target:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      assignedTo: "",
      projectId: "",
      targetValue: "",
      currentValue: "",
      unit: "",
      status: "",
    })
    setDate(undefined)
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!target) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Target</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title">Target Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Reach 10,000 followers"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe what needs to be achieved..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => handleInputChange("assignedTo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((member) => {
                      // Handle different possible data structures for workspace members
                      const memberId = member.memberId 
                      const memberName = member.username || "Unknown User"
                      const memberEmail = member.email || "No email"

                      return (
                        <SelectItem key={memberId} value={memberId}>
                          {memberName} ({memberEmail})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="projectId">Project (Optional)</Label>
                <Select value={formData.projectId} onValueChange={(value) => handleInputChange("projectId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="targetValue">Target Value</Label>
                <Input
                  id="targetValue"
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => handleInputChange("targetValue", e.target.value)}
                  placeholder="e.g., 10000"
                  min="1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currentValue">Current Value</Label>
                <Input
                  id="currentValue"
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) => handleInputChange("currentValue", e.target.value)}
                  placeholder="e.g., 5000"
                  min="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleInputChange("unit", e.target.value)}
                  placeholder="e.g., followers, tasks, sales"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a deadline</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 size={16} className="mr-2" />
              {isDeleting ? "Deleting..." : "Delete Target"}
            </Button>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !formData.title ||
                  !formData.description ||
                  !formData.assignedTo ||
                  !formData.targetValue ||
                  !formData.unit ||
                  !date
                }
              >
                {isLoading ? "Updating..." : "Update Target"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
