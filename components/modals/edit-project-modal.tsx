"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, FolderOpen, Calendar, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { projectApi, teamApi } from "@/lib/api" // Import from lib/api
import { successToast, errorToast } from "@/lib/toast-utils"

type EditProjectModalProps = {
  isOpen: boolean
  onClose: () => void
  project: any
  onSuccess?: (project: any) => void
  onDelete?: (projectId: string) => void
}

export default function EditProjectModal({ isOpen, onClose, project, onSuccess, onDelete }: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    teamId: "none",
  })
  const [teams, setTeams] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        startDate: project.startDate || "",
        endDate: project.endDate || "",
        teamId: project.teamId || "none",
      })
      fetchTeams()
    }
  }, [isOpen, project])

  const fetchTeams = async () => {
    setIsLoadingTeams(true)
    try {
      // Using teamApi from lib/api instead of direct fetch
      const response = await teamApi.getTeams()
      if (response.success) {
        setTeams(response.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error)
    } finally {
      setIsLoadingTeams(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsLoading(true)
    try {
      // Using projectApi from lib/api instead of direct fetch
      const response = await projectApi.updateProject(project.id, formData)

      if (response.success) {
        successToast({
          title: "Project Updated",
          description: "The project has been successfully updated.",
        })
        onSuccess?.(response.data)
        handleClose()
      } else {
        errorToast({
          title: "Update Failed",
          description: response.error || "Failed to update project. Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to update project:", error)
      errorToast({
        title: "Update Failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!project?.id) return

    setIsLoading(true)
    try {
      // Using projectApi from lib/api instead of direct fetch
      const response = await projectApi.deleteProject(project.id)

      if (response.success) {
        successToast({
          title: "Project Deleted",
          description: "The project has been successfully deleted.",
        })
        onDelete?.(project.id)
        handleClose()
      } else {
        errorToast({
          title: "Delete Failed",
          description: response.error || "Failed to delete project. Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to delete project:", error)
      errorToast({
        title: "Delete Failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      teamId: "none",
    })
    setShowDeleteConfirm(false)
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!project) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Project</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClose} className="p-1 h-8 w-8">
                <X size={16} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="space-y-6">
            <div className="text-center py-6">
              <Trash2 size={48} className="mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Project</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete &quot;{project.name}&quot;? This will also delete all associated tasks.
                This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteProject}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isLoading ? "Deleting..." : "Delete Project"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-medium font-medium text-gray-900">
                Project Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter project name"
                className="w-full"
                disabled={isLoading}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-medium font-medium text-gray-900">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your project..."
                rows={3}
                className="w-full resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Team Assignment */}
            <div className="space-y-2">
              <label className="text-medium font-medium text-gray-900">Assign to Team (Optional)</label>
              <Select value={formData.teamId} onValueChange={(value) => handleInputChange("teamId", value)}>
                <SelectTrigger className="w-full" disabled={isLoadingTeams || isLoading}>
                  <SelectValue placeholder={isLoadingTeams ? "Loading teams..." : "Select a team"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team</SelectItem>
                  {teams.map((team: any) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.teamName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="startDate" className="text-medium font-medium text-gray-900">
                  Start Date
                </label>
                <div className="relative">
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    className="w-full"
                    disabled={isLoading}
                  />
                  <Calendar
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="endDate" className="text-medium font-medium text-gray-900">
                  End Date
                </label>
                <div className="relative">
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                    className="w-full"
                    disabled={isLoading}
                    min={formData.startDate}
                  />
                  <Calendar
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <FolderOpen size={16} />
                    <span>Update Project</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
