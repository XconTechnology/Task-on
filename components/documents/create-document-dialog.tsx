"use client"

import type React from "react"

import { useState, useRef } from "react"
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
import { Upload, X } from "lucide-react"
import { documentApi, projectApi, taskApi } from "@/lib/api"
import type { Project, Task } from "@/lib/types"
import { useEffect } from "react"

interface CreateDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateDocumentDialog({ open, onOpenChange, onSuccess }: CreateDocumentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedProject, setSelectedProject] = useState<string>("none")
  const [selectedTask, setSelectedTask] = useState<string>("none")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!formData.name) {
        setFormData((prev) => ({ ...prev, name: file.name }))
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !formData.name.trim()) return

    setLoading(true)
    try {
      const submitData = new FormData()
      submitData.append("file", selectedFile)
      submitData.append("name", formData.name.trim())
      submitData.append("description", formData.description.trim())
      if (selectedProject !== "none") submitData.append("projectId", selectedProject)
      if (selectedTask !== "none") submitData.append("taskId", selectedTask)

      const response = await documentApi.createDocument(submitData)
      if (response.success) {
        onSuccess()
        handleClose()
      }
    } catch (error) {
      console.error("Failed to create document:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: "", description: "" })
    setSelectedFile(null)
    setSelectedProject("none")
    setSelectedTask("none")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onOpenChange(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new document to your workspace. You can optionally associate it with a project and task.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>File *</Label>
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">Max file size: 50MB</p>
              </div>
            ) : (
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="*/*" />
          </div>

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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || !formData.name.trim() || loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
