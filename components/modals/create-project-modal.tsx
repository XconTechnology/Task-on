"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, FolderOpen, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { projectApi, teamApi } from "@/lib/api" // Import from lib/api
import { successToast, errorToast } from "@/lib/toast-utils"

type CreateProjectModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (project: any) => void
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    teamId: "none", // Updated default value to be a non-empty string
  })
  const [teams, setTeams] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchTeams()
    }
  }, [isOpen])

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
      const response = await projectApi.createProject(formData)

      if (response.success) {
        successToast({
          title: "Project Created",
          description: "The project has been successfully created.",
        })
        onSuccess?.(response.data)
        handleClose()
      } else {
        errorToast({
          title: "Project Creation Failed",
          description: response.error || "Failed to create project. Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to create project:", error)
      errorToast({
        title: "Project Creation Failed",
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
      teamId: "none", // Updated default value to be a non-empty string
    })
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">Create New Project</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="p-1 h-8 w-8">
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

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
                <SelectItem value="none">No team</SelectItem> {/* Updated value prop to be a non-empty string */}
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
              <span className="text-medium">Cancel</span>
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span className="text-medium">Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <FolderOpen size={16} />
                  <span className="text-medium">Create Project</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
