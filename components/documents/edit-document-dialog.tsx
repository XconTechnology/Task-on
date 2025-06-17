"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { documentApi, projectApi, taskApi } from "@/lib/api"
import type { Document, Project, Task } from "@/lib/types"

interface EditDocumentDialogProps {
  document: Document | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditDocumentDialog({ document, open, onOpenChange, onSuccess }: EditDocumentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("none")
  const [selectedTask, setSelectedTask] = useState<string>("none")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  // Initialize form data when document changes
  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name,
        description: document.description || "",
      })
      setSelectedProject(document.projectId || "none")
      setSelectedTask(document.taskId || "none")
    }
  }, [document])

  // Load projects and tasks
  useEffect(() => {
    if (open) {
      loadProjects()
      loadTasks()
    }
  }, [open])

  // Load tasks when project changes
  useEffect(() => {
    if (selectedProject !== "none") {
      loadTasksForProject(selectedProject)
    } else {
      loadTasks()
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      const response = await projectApi.getProjects()
      if (response.success && response.data) {
        setProjects(response.data)
      }
    } catch (error) {
      console.error("Failed to load projects:", error)
    }
  }

  const loadTasks = async () => {
    try {
      const response = await taskApi.getALLTasks()
      if (response.success && response.data) {
        setTasks(response.data)
      }
    } catch (error) {
      console.error("Failed to load tasks:", error)
    }
  }

  const loadTasksForProject = async (projectId: string) => {
    try {
      const response = await taskApi.getTasks(projectId)
      if (response.success && response.data) {
        setTasks(response.data)
      }
    } catch (error) {
      console.error("Failed to load project tasks:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!document || !formData.name.trim()) return

    setLoading(true)
    try {
      const updates = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        projectId: selectedProject !== "none" ? selectedProject : undefined,
        taskId: selectedTask !== "none" ? selectedTask : undefined,
      }

      const response = await documentApi.updateDocument(document.id, updates)
      if (response.success) {
        onSuccess()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Failed to update document:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>Update the document information and associations.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Document Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter document name"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter document description (optional)"
              rows={3}
            />
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label>Project (Optional)</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
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

          {/* Task Selection */}
          <div className="space-y-2">
            <Label>Task (Optional)</Label>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger>
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Task</SelectItem>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Updating..." : "Update Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
